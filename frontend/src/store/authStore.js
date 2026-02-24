import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      activeBranch:    null, // { id, name, town } — super_admin active branch

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, activeBranch: null });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, activeBranch: null });
        window.location.href = '/login';
      },

      updateUser: (user) => set({ user }),

      // Super admin switches to operate as a specific branch
      setActiveBranch: (branch) => set({ activeBranch: branch }),

      // The effective branch_id to use for ALL operations
      getEffectiveBranchId: () => {
        const { user, activeBranch } = get();
        if (!user) return null;
        if (user.role === 'super_admin' && activeBranch) return activeBranch.id;
        return user.branch_id;
      },

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
    {
      name: 'helvino-auth',
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
        activeBranch:    state.activeBranch,
      }),
    }
  )
);
