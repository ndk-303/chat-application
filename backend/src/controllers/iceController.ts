import { Request, Response } from 'express';

export const getIceServers = (_req: Request, res: Response) => {
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const turnUrls = process.env.TURN_URLS;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    if (turnUrls && turnUsername && turnCredential) {
        const urls = turnUrls.split(',').map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
            iceServers.push({
                urls,
                username: turnUsername,
                credential: turnCredential,
            });
        }
    }

    return res.json({ iceServers });
};
