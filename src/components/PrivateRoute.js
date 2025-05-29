import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser || (currentUser.isAnonymous && !isAdmin)) {
    return null; // أو يمكنك عرض رسالة تحميل
  }

  return children;
};

export default PrivateRoute;