import { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // كلمة المرور الموحدة للنظام
  const SYSTEM_PASSWORD = "ZoZowhmoed1234!@#$%";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // يعامل جميع الزوار كمستخدمين مجهولين
      setCurrentUser({ isAnonymous: true });
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  // دالة التحقق من كلمة المرور
  const verifyAccess = (enteredPassword) => {
    return enteredPassword === SYSTEM_PASSWORD;
  };

  const value = {
    currentUser,
    verifyAccess,
    isAdmin: true // يمكنك تغيير هذا حسب الحاجة
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};