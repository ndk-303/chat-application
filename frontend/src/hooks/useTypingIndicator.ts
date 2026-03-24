import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';

export function useTypingIndicator(conversationId: string | null) {
    const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        if (!conversationId) return;

        const handler = (data: {
            userId: string;
            conversationId: string;
            isTyping: boolean;
        }) => {
            if (data.conversationId !== conversationId) return;

            const { userId, isTyping } = data;

            if (isTyping) {
                setTypingUserIds((prev) => new Set([...prev, userId]));

                // Auto-expire after 4s in case typing_stop is never received
                if (timers.current[userId]) clearTimeout(timers.current[userId]);
                timers.current[userId] = setTimeout(() => {
                    setTypingUserIds((prev) => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    });
                }, 4000);
            } else {
                if (timers.current[userId]) clearTimeout(timers.current[userId]);
                setTypingUserIds((prev) => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        };

        // Attach + re-attach when socket reconnects
        const attach = () => {
            const s = getSocket();
            if (s) s.on('typing', handler);
        };

        const detach = () => {
            const s = getSocket();
            if (s) s.off('typing', handler);
        };

        attach();

        // Also handle reconnects
        const s = getSocket();
        s?.on('connect', attach);

        return () => {
            detach();
            s?.off('connect', attach);
            Object.values(timers.current).forEach(clearTimeout);
            timers.current = {};
        };
    }, [conversationId]);

    return typingUserIds;
}
