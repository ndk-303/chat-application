import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "/api",
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes('/auth/refresh-token') || originalRequest.url?.includes('/auth/logout')) {
            return Promise.reject(error);
        }

        // Nếu 401 và chưa retry, thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { data } = await api.post('/auth/refresh-token');
                const newToken = data.accessToken;

                // Cập nhật token trong store và localStorage
                useAuthStore.getState().setToken(newToken);

                // Retry request gốc với token mới
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch {
                // Refresh thất bại → logout
                await useAuthStore.getState().logout();
            }
        }

        return Promise.reject(error);
    }
);

export default api;