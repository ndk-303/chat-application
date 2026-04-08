import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
});

export const pubClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
});

export const subClient = pubClient.duplicate();

redisClient.on('connect', () => console.log('[Redis] General client connected'));
redisClient.on('error', (err) => console.error('[Redis] General client error:', err.message));

pubClient.on('connect', () => console.log('[Redis] Pub client connected'));
pubClient.on('error', (err) => console.error('[Redis] Pub error:', err.message));

subClient.on('connect', () => console.log('[Redis] Sub client connected'));
subClient.on('error', (err) => console.error('[Redis] Sub error:', err.message));

export const connectRedis = async (): Promise<void> => {
    const clients = [redisClient, pubClient, subClient];

    await Promise.all(
        clients.map(async (client) => {
            if (client.status === 'wait') {
                await client.connect();
            }
        })
    );
};
