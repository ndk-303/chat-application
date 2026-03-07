import {create} from "zustand";
import {toast} from "sonner";

export const useAuthStore = create((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,
    
    signup: async (username, password, email, firstName, lastName) => {
        try {
            set({ loading: true });

            // gọi api

            toast.success("Registration successful! You will be redirected to the login page");
        } catch (error) {
            console.error(error);
            toast.error("Registration failed");
        } finally {
            set({ loading: false });
        }
    },
}));