import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRole } from '../services/authService';

// State sesi: user (uid/email) + role. Di-restore dari async-storage lalu
// divalidasi ulang oleh onAuthStateChanged di App.js saat app start.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setRole: (role) => set({ role }),
      // Validasi ulang role dari dokumen users/{uid}.
      refreshRole: async (uid) => {
        const role = await getRole(uid);
        set({ role });
        return role;
      },
      logout: () => set({ user: null, role: null, loading: false }),
    }),
    {
      name: 'kasir-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        loading: state.loading,
      }),
    }
  )
);