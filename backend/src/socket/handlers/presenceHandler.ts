import { Server, Socket } from 'socket.io';
import UserModel from '../../models/User';
import FriendshipModel from '../../models/Friendship';
import { emitToUser } from '../socketManager';

type GetUserSocketsFn = (userId: string) => Promise<string[]>;

const registerPresenceHandlers = (
    io: Server,
    socket: Socket,
    getUserSockets: GetUserSocketsFn
): void => {
    const userId = socket.data.userId as string;

    const handleConnect = async () => {
        try {
            // Read the user's current status BEFORE overriding it.
            // If they manually set "offline" (ẩn trạng thái) we must respect that
            // and NOT broadcast them as online to friends.
            const user = await UserModel.findById(userId).select('status').lean();
            const isHiding = user?.status === 'offline';

            if (!isHiding) {
                // Normal connect: mark online and notify friends
                await UserModel.findByIdAndUpdate(userId, {
                    status: 'online',
                    lastSeen: new Date(),
                });

                const friendIds = await getFriendIds(userId);
                for (const friendId of friendIds) {
                    await emitToUser(friendId, 'user_online', { userId });
                }
            }
            // If hiding: do nothing — friends continue to see them as offline
        } catch (err) {
            console.error('[Presence] Error on connect:', err);
        }
    };

    socket.on('disconnect', async () => {
        // Short delay: wait for Redis socket cleanup to propagate
        setTimeout(async () => {
            try {
                const remainingSockets = await getUserSockets(userId);
                if (remainingSockets.length === 0) {
                    // Only update lastSeen; preserve manual 'offline' status
                    const user = await UserModel.findById(userId).select('status').lean();
                    const isHiding = user?.status === 'offline';

                    const lastSeen = new Date();
                    await UserModel.findByIdAndUpdate(userId, { lastSeen });

                    if (!isHiding) {
                        // Was genuinely online — mark offline and notify friends
                        await UserModel.findByIdAndUpdate(userId, { status: 'offline' });
                        const friendIds = await getFriendIds(userId);
                        for (const friendId of friendIds) {
                            await emitToUser(friendId, 'user_offline', { userId, lastSeen });
                        }
                    }
                    // If already hiding: friends see no change — still "offline"
                }
            } catch (err) {
                console.error('[Presence] Error on disconnect:', err);
            }
        }, 1000);
    });

    // Allow 'offline' so the frontend can set "ẩn trạng thái"
    socket.on('set_status', async (data: { status: 'online' | 'offline' }) => {
        const { status } = data;
        if (!['online', 'offline'].includes(status)) return;

        try {
            await UserModel.findByIdAndUpdate(userId, { status, lastSeen: new Date() });

            const friendIds = await getFriendIds(userId);
            if (status === 'online') {
                for (const friendId of friendIds) {
                    await emitToUser(friendId, 'user_online', { userId });
                }
            } else {
                // status === 'offline' — tell friends user is now invisible
                const lastSeen = new Date();
                for (const friendId of friendIds) {
                    await emitToUser(friendId, 'user_offline', { userId, lastSeen });
                }
            }
        } catch (err) {
            console.error('[Presence] Error setting status:', err);
        }
    });

    handleConnect();
};

const getFriendIds = async (userId: string): Promise<string[]> => {
    const friendships = await FriendshipModel.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
    });

    return friendships.map(f =>
        f.user1Id.toString() === userId
            ? f.user2Id.toString()
            : f.user1Id.toString()
    );
};

export default registerPresenceHandlers;