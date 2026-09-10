import crypto from 'crypto';
import { Request, Response } from 'express';

export const getIceServers = (req: Request, res: Response) => {
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const turnUrls = process.env.TURN_URLS;
    const turnSecret = process.env.TURN_SECRET;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    if (turnUrls) {
        const urls = turnUrls.split(',').map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
            if (turnSecret) {
                // T-012: HMAC-SHA1 time-limited TURN credentials (RFC 8489 / coturn static-auth-secret)
                const userId = (req as any).user?.userId || 'anonymous';
                const ttl = 86400; // 24 hours in seconds
                const expiry = Math.floor(Date.now() / 1000) + ttl;
                const username = `${expiry}:${userId}`;
                const hmac = crypto.createHmac('sha1', turnSecret);
                hmac.update(username);
                const credential = hmac.digest('base64');

                iceServers.push({
                    urls,
                    username,
                    credential,
                });
            } else if (turnUsername && turnCredential) {
                iceServers.push({
                    urls,
                    username: turnUsername,
                    credential: turnCredential,
                });
            }
        }
    }

    return res.json({ iceServers });
};
