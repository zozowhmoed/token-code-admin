import { db } from './firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

// دالة مساعدة لتوليد كود مميز آمن
const generateSecureCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint32Array(16);
  window.crypto.getRandomValues(array);
  let code = '';
  array.forEach(value => {
    code += chars[value % chars.length];
  });
  return code;
};

export const getUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

export const getCodeByUserId = async (userId) => {
  try {
    const codeRef = doc(db, 'userCodes', userId);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      return codeSnap.data().code;
    }
    return null;
  } catch (error) {
    console.error("Error getting user code:", error);
    throw error;
  }
};

export const createUserCode = async (userId) => {
  try {
    const code = generateSecureCode();
    
    await runTransaction(db, async (transaction) => {
      // إنشاء وثيقة في collection أكواد المستخدمين
      const codeRef = doc(db, 'userCodes', userId);
      transaction.set(codeRef, {
        code: code,
        createdAt: serverTimestamp(),
        userId: userId
      });
      
      // تحديث الكود في collection المستخدمين
      const userRef = doc(db, 'users', userId);
      transaction.update(userRef, {
        uniqueCode: code,
        hasVerifiedCode: false,
        codeGeneratedAt: serverTimestamp()
      });
    });
    
    return { code };
  } catch (error) {
    console.error("Error creating user code:", error);
    throw error;
  }
};

export const updateUserCode = async (userId) => {
  try {
    const code = generateSecureCode();
    
    await runTransaction(db, async (transaction) => {
      // تحديث الكود في collection أكواد المستخدمين
      const codeRef = doc(db, 'userCodes', userId);
      transaction.set(codeRef, {
        code: code,
        updatedAt: serverTimestamp(),
        userId: userId
      }, { merge: true });
      
      // تحديث الكود في collection المستخدمين
      const userRef = doc(db, 'users', userId);
      transaction.update(userRef, {
        uniqueCode: code,
        hasVerifiedCode: false,
        codeGeneratedAt: serverTimestamp()
      });
    });
    
    return { code };
  } catch (error) {
    console.error("Error updating user code:", error);
    throw error;
  }
};

export const verifyUserCode = async (userId, enteredCode) => {
  try {
    let verificationResult = false;
    
    await runTransaction(db, async (transaction) => {
      // الحصول على الكود من collection أكواد المستخدمين
      const codeRef = doc(db, 'userCodes', userId);
      const codeSnap = await transaction.get(codeRef);
      
      if (!codeSnap.exists()) {
        throw new Error("User code not found");
      }
      
      const codeData = codeSnap.data();
      
      if (codeData.code === enteredCode) {
        // تحديث حالة التحقق في collection المستخدمين
        const userRef = doc(db, 'users', userId);
        transaction.update(userRef, {
          hasVerifiedCode: true,
          codeVerifiedAt: serverTimestamp()
        });
        verificationResult = true;
      }
    });
    
    return verificationResult;
  } catch (error) {
    console.error("Error verifying code:", error);
    throw error;
  }
};

export const getAllUsersWithCodes = async () => {
  try {
    const usersRef = collection(db, 'users');
    const userCodesRef = collection(db, 'userCodes');
    
    const [usersSnapshot, codesSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(userCodesRef)
    ]);
    
    const usersMap = new Map();
    usersSnapshot.forEach(doc => {
      usersMap.set(doc.id, doc.data());
    });
    
    const result = [];
    codesSnapshot.forEach(doc => {
      if (usersMap.has(doc.id)) {
        result.push({
          id: doc.id,
          ...usersMap.get(doc.id),
          uniqueCode: doc.data().code
        });
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error getting all users with codes:", error);
    throw error;
  }
};

export const logLoginAttempt = async (attemptType, success, errorMessage = '', userId = null) => {
  try {
    const loginAttemptsRef = collection(db, 'loginAttempts');
    await addDoc(loginAttemptsRef, {
      attemptType,
      success,
      errorMessage,
      timestamp: serverTimestamp(),
      userId,
      ip: 'system'
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
    throw error;
  }
};

export const getCodeInfo = async (userId) => {
  try {
    const [userSnap, codeSnap] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(doc(db, 'userCodes', userId))
    ]);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    const codeData = codeSnap.exists() ? codeSnap.data() : null;
    
    return {
      code: codeData?.code || null,
      generatedAt: codeData?.createdAt?.toDate() || null,
      verified: userData.hasVerifiedCode || false,
      verifiedAt: userData.codeVerifiedAt?.toDate() || null
    };
  } catch (error) {
    console.error("Error getting code info:", error);
    throw error;
  }
};

export const checkCodeVerification = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    return userSnap.data().hasVerifiedCode || false;
  } catch (error) {
    console.error("Error checking verification:", error);
    return false;
  }
};