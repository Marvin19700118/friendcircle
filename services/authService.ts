import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
    updateProfile,
    AuthError,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// Map Firebase auth errors to user-friendly messages
const getErrorMessage = (error: AuthError) => {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return '此 Email 已被註冊';
        case 'auth/invalid-email':
            return 'Email 格式不正確';
        case 'auth/operation-not-allowed':
            return '此登入方式目前未啟用';
        case 'auth/weak-password':
            return '密碼強度不足';
        case 'auth/user-disabled':
            return '此帳號已被停用';
        case 'auth/user-not-found':
            return '找不到此帳號';
        case 'auth/wrong-password':
            return '密碼錯誤';
        case 'auth/popup-closed-by-user':
            return '登入視窗已關閉';
        case 'auth/popup-blocked':
            return '登入視窗被瀏覽器攔截，請允許彈出視窗';
        default:
            return '發生未知錯誤，請稍後再試 (' + error.code + ')';
    }
};

export const registerUser = async (email: string, password: string, name: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: getErrorMessage(error as AuthError) };
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: getErrorMessage(error as AuthError) };
    }
};

export const loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: getErrorMessage(error as AuthError) };
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: getErrorMessage(error as AuthError) };
    }
};

export type { FirebaseUser };
