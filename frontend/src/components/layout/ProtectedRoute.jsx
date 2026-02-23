import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = ({ children, minRole }) => {
  const { isAuthenticated, canAccess } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (minRole && !canAccess(minRole)) return <Navigate to="/dashboard" replace />;
  return children;
};
