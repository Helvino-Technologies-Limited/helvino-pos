import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      updateUser: (user) => set({ user }),

      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        if (typeof roles === 'string') return user.role === roles || user.role === 'super_admin';
        return roles.includes(user.role) || user.role === 'super_admin';
      },

      canAccess: (minRole) => {
        const hierarchy = {
          super_admin: 7, admin: 6, manager: 5,
          shift_supervisor: 4, accountant: 3, cashier: 2, internet_operator: 1,
        };
        const user = get().user;
        if (!user) return false;
        return (hierarchy[user.role] || 0) >= (hierarchy[minRole] || 0);
      },
    }),
    { name: 'helvino-auth', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
);
