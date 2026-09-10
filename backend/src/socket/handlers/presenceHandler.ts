import { Server, Socket } from 'socket.io';
import UserModel from '../../models/User';
import FriendshipModel from '../../models/Friendship';
import { emitToUser, getUserSockets } from '../socketManager';
import { redisClient } from '../../config/redis';

type GetUserSocketsFn = (userId: string) => Promise<string[]>;

/** Redis TTL for cached friend-ID lists (seconds). */
const FRIEND_CACHE_TTL = 60;

/**
 * Returns the list of friend user IDs for `userId`.
 * Results are cached in Redis for FRIEND_CACHE_TTL seconds to avoid a DB
 * round-trip on every connect / disconnect / set_status event.
 */
const getFriendIds = async (userId: string): Promise<string[]> => {
    const cacheKey = `friends:${userId}`;
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached) as string[];
    } catch { /* cache miss — fall through to DB */ }

    const friendships = await FriendshipModel.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
    }).lean();

    const ids = friendships.map(f =>
        f.user1Id.toString() === userId
            ? f.user2Id.toString()
            : f.user1Id.toString()
    );

    try {
        await redisClient.setex(cacheKey, FRIEND_CACHE_TTL, JSON.stringify(ids));
    } catch { /* non-fatal */ }

    return ids;
};

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
                // User wants to be visible — mark online and notify friends in parallel
                await UserModel.findByIdAndUpdate(userId, {
                    status: 'online',
                    lastSeen: new Date(),
                });
                const friendIds = await getFriendIds(userId);
                await Promise.all(friendIds.map(id => emitToUser(id, 'user_online', { userId })));
            }
            // If hiding: keep status='offline', friends see no change
        } catch (err) {
            console.error('[Presence] Error on connect:', err);
        }
    };

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        // Short delay: let Redis propagate socket removal before checking remaining sockets.
        setTimeout(async () => {
            try {
                const remainingSockets = await getUserSockets(userId);
                if (remainingSockets.length > 0) return; // other tabs still open

                const lastSeen = new Date();

                // Single query: update status and fetch statusPreference atomically.
                const user = await UserModel.findByIdAndUpdate(
                    userId,
                    { lastSeen, status: 'offline' },
                    { new: false } // return the pre-update doc to read statusPreference
                ).select('statusPreference').lean();

                const isHiding = user?.statusPreference === 'hidden';

                if (!isHiding) {
                    // Was genuinely online — notify friends in parallel
                    const friendIds = await getFriendIds(userId);
                    await Promise.all(
                        friendIds.map(id => emitToUser(id, 'user_offline', { userId, lastSeen }))
                    );
                }
                // If hiding: friends already saw them as offline — no further action needed
            } catch (err) {
                console.error('[Presence] Error on disconnect:', err);
            }
        }, 1000);
    });

    // ── set_status (user preference) ─────────────────────────────────────────
    // The client emits 'online' or 'hidden'.
    socket.on('set_status', async (data: { status: 'online' | 'hidden' }) => {
        const { status: preference } = data;
        if (!['online', 'hidden'].includes(preference)) return;

        try {
            const friendIds = await getFriendIds(userId);

            if (preference === 'hidden') {
                // User wants to hide — save preference, mark offline, tell friends in parallel
                const lastSeen = new Date();
                await UserModel.findByIdAndUpdate(userId, {
                    statusPreference: 'hidden',
                    status: 'offline',
                    lastSeen,
                });
                await Promise.all(
                    friendIds.map(id => emitToUser(id, 'user_offline', { userId, lastSeen }))
                );
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
                    await Promise.all(
                        friendIds.map(id => emitToUser(id, 'user_online', { userId }))
                    );
                }
            }
        } catch (err) {
            console.error('[Presence] Error setting status:', err);
        }
    });

    handleConnect();
};

export default registerPresenceHandlers;
