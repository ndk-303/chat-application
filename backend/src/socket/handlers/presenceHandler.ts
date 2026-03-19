import { Server, Socket } from 'socket.io';
import UserModel from '../../models/User';
import FriendshipModel from '../../models/Friendship';
import { emitToUser } from '../socketManager';

export const registerPresenceHandlers = (
    io: Server,
    socket: Socket,
    userSocketMap: Map<string, Set<string>>
): void => {
    const userId = socket.data.userId as string;

    const handleConnect = async () => {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                status: 'online',
                lastSeen: new Date()
            });

            const friendIds = await getFriendIds(userId);
            friendIds.forEach(friendId => {
                emitToUser(friendId, 'user_online', { userId });
            });
        } catch (err) {
            console.error('[Presence] Error on connect:', err);
        }
    };

    socket.on('disconnect', async () => {
        setTimeout(async () => {
            const remainingSockets = userSocketMap.get(userId);
            if (!remainingSockets || remainingSockets.size === 0) {
                try {
                    const lastSeen = new Date();
                    await UserModel.findByIdAndUpdate(userId, {
                        status: 'offline',
                        lastSeen
                    });

                    const friendIds = await getFriendIds(userId);
                    friendIds.forEach(friendId => {
                        emitToUser(friendId, 'user_offline', { userId, lastSeen });
                    });
                } catch (err) {
                    console.error('[Presence] Error on disconnect:', err);
                }
            }
        }, 500);
    });

    socket.on('set_status', async (data: { status: 'online' | 'away' | 'busy' }) => {
        const { status } = data;
        if (!['online', 'away', 'busy'].includes(status)) return;

        try {
            await UserModel.findByIdAndUpdate(userId, { status });

            const friendIds = await getFriendIds(userId);
            friendIds.forEach(friendId => {
                emitToUser(friendId, 'user_status_changed', { userId, status });
            });
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
