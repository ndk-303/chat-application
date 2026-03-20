import { redisClient } from '../config/redis';

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const raw = await redisClient.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch (err) {
        console.warn(`[Cache] GET error for key "${key}":`, err);
        return null;
    }
}

export async function setCache(key: string, value: unknown, ttlSec = 300): Promise<void> {
    try {
        await redisClient.setex(key, ttlSec, JSON.stringify(value));
    } catch (err) {
        console.warn(`[Cache] SET error for key "${key}":`, err);
    }
}

export async function delCache(...keys: string[]): Promise<void> {
    try {
        if (keys.length > 0) await redisClient.del(...keys);
    } catch (err) {
        console.warn(`[Cache] DEL error for keys "${keys.join(', ')}":`, err);
    }
}
