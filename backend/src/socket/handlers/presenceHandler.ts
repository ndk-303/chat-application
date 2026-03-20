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
            await UserModel.findByIdAndUpdate(userId, {
                status: 'online',
                lastSeen: new Date()
            });

            const friendIds = await getFriendIds(userId);
            for (const friendId of friendIds) {
                await emitToUser(friendId, 'user_online', { userId });
            }
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
                    const lastSeen = new Date();
                    await UserModel.findByIdAndUpdate(userId, {
                        status: 'offline',
                        lastSeen
                    });

                    const friendIds = await getFriendIds(userId);
                    for (const friendId of friendIds) {
                        await emitToUser(friendId, 'user_offline', { userId, lastSeen });
                    }
                }
            } catch (err) {
                console.error('[Presence] Error on disconnect:', err);
            }
        }, 1000); // 1s delay to let Redis propagate the socket removal
    });

    socket.on('set_status', async (data: { status: 'online' | 'away' | 'busy' }) => {
        const { status } = data;
        if (!['online', 'away', 'busy'].includes(status)) return;

        try {
            await UserModel.findByIdAndUpdate(userId, { status });

            const friendIds = await getFriendIds(userId);
            for (const friendId of friendIds) {
                await emitToUser(friendId, 'user_status_changed', { userId, status });
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