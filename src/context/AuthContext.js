import { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const SYSTEM_PASSWORD = "ZoZowhmoed1234!@#$%";
  const SECURITY_QUESTION = "ما هو اسم والدك؟";
  const SECURITY_ANSWER = "محمد";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || { isAnonymous: true });
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  const login = async (password, answer) => {
    if (password !== SYSTEM_PASSWORD) {
      throw new Error("كلمة المرور غير صحيحة");
    }
    
    if (answer !== SECURITY_ANSWER) {
      throw new Error("إجابة السؤال الأمني غير صحيحة");
    }
    
    return true;
  };

  const value = {
    currentUser,
    login,
    securityQuestion: SECURITY_QUESTION,
    isAdmin: true
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