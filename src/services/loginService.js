import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logLoginAttempt = async (attemptType, success, errorMessage = '') => {
  try {
    const loginAttemptsRef = collection(db, 'loginAttempts');
    await addDoc(loginAttemptsRef, {
      attemptType,
      success,
      errorMessage,
      timestamp: serverTimestamp(),
      ip: 'system' // يمكنك إضافة IP حقيقي إذا كنت تريد تتبع الموقع
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
    throw error;
  }
};