import { Server, Socket } from 'socket.io';
import UserModel from '../../models/User';
import FriendshipModel from '../../models/Friendship';
import { emitToUser, getUserSockets } from '../socketManager';

type GetUserSocketsFn = (userId: string) => Promise<string[]>;

const registerPresenceHandlers = (
    io: Server,
    socket: Socket,
    _getUserSockets: GetUserSocketsFn
): void => {
    const userId = socket.data.userId as string;

    // ── Connect ──────────────────────────────────────────────────────────────
    const handleConnect = async () => {
        try {
            const user = await UserModel.findById(userId).select('statusPreference').lean();
            const isHiding = user?.statusPreference === 'hidden';

            if (!isHiding) {
                // User wants to be visible — mark online and notify friends
                await UserModel.findByIdAndUpdate(userId, {
                    status: 'online',
                    lastSeen: new Date(),
                });
                const friendIds = await getFriendIds(userId);
                for (const friendId of friendIds) {
                    await emitToUser(friendId, 'user_online', { userId });
                }
            }
            // If hiding: keep status='offline', friends see no change
        } catch (err) {
            console.error('[Presence] Error on connect:', err);
        }
    };

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        // Short delay: let Redis propagate socket removal
        setTimeout(async () => {
            try {
                const remainingSockets = await getUserSockets(userId);
                if (remainingSockets.length > 0) return; // other tabs still open

                const lastSeen = new Date();
                const user = await UserModel.findById(userId).select('statusPreference').lean();
                const isHiding = user?.statusPreference === 'hidden';

                await UserModel.findByIdAndUpdate(userId, { lastSeen, status: 'offline' });

                if (!isHiding) {
                    // Was genuinely online — notify friends they're now offline
                    const friendIds = await getFriendIds(userId);
                    for (const friendId of friendIds) {
                        await emitToUser(friendId, 'user_offline', { userId, lastSeen });
                    }
                }
                // If hiding: friends already saw them as offline — no further action needed
            } catch (err) {
                console.error('[Presence] Error on disconnect:', err);
            }
        }, 1000);
    });

    // ── set_status (user preference) ─────────────────────────────────────────
    // Frontend emits 'online' or 'hidden'
    socket.on('set_status', async (data: { status: 'online' | 'hidden' }) => {
        const { status: preference } = data;
        if (!['online', 'hidden'].includes(preference)) return;

        try {
            const friendIds = await getFriendIds(userId);

            if (preference === 'hidden') {
                // User wants to hide — save preference, mark offline, tell friends
                await UserModel.findByIdAndUpdate(userId, {
                    statusPreference: 'hidden',
                    status: 'offline',
                    lastSeen: new Date(),
                });
                const lastSeen = new Date();
                for (const friendId of friendIds) {
                    await emitToUser(friendId, 'user_offline', { userId, lastSeen });
                }
            } else {
                // User wants to be visible — save preference
                await UserModel.findByIdAndUpdate(userId, { statusPreference: 'online' });

                // Only mark online if they actually have an active socket connection
                const activeSockets = await getUserSockets(userId);
                if (activeSockets.length > 0) {
                    await UserModel.findByIdAndUpdate(userId, {
                        status: 'online',
                        lastSeen: new Date(),
                    });
                    for (const friendId of friendIds) {
                        await emitToUser(friendId, 'user_online', { userId });
                    }
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