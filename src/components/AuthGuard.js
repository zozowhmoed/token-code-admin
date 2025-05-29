import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const AuthGuard = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;