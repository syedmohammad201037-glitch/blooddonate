import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// In-memory admin session (No localStorage)
let inMemoryAdminUser: AdminUser | null = null;

// Secret pass key required to create a new coordinator/admin account via email
const ADMIN_CREATE_PASSKEY = 'JAMAAT-BLOOD-2026';

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'superadmin' | 'coordinator';
}

export const getStoredAdminSession = (): AdminUser | null => {
  if (inMemoryAdminUser) return inMemoryAdminUser;
  const current = auth.currentUser;
  if (current) {
    inMemoryAdminUser = {
      uid: current.uid,
      email: current.email || '',
      displayName: current.displayName || current.email?.split('@')[0],
      role: 'superadmin'
    };
    return inMemoryAdminUser;
  }
  return null;
};

export const setStoredAdminSession = (admin: AdminUser | null) => {
  inMemoryAdminUser = admin;
};

// Sync auth state listener with Firebase Auth and Firestore
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      inMemoryAdminUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0],
        role: 'superadmin'
      };

      // Sync with Firestore admins collection
      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const snap = await getDoc(adminDocRef);
        if (!snap.exists()) {
          await setDoc(adminDocRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0],
            role: 'superadmin',
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Firestore admin sync:", e);
      }
    } else {
      inMemoryAdminUser = null;
    }
  });
}

/**
 * Sign in using Google (Native Firebase Authentication)
 */
export const loginWithGoogle = async (): Promise<{ success: boolean; user?: AdminUser; message: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    
    const adminUser: AdminUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
      role: 'superadmin'
    };
    setStoredAdminSession(adminUser);

    // Save/update admin profile in Firestore
    try {
      await setDoc(doc(db, "admins", adminUser.uid), {
        uid: adminUser.uid,
        email: adminUser.email,
        displayName: adminUser.displayName,
        role: adminUser.role,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore admin save notice:", e);
    }

    return {
      success: true,
      user: adminUser,
      message: "Signed in with Google successfully!"
    };
  } catch (error: any) {
    console.error("Firebase Google Auth error:", error);
    let msg = error?.message || "Failed to sign in with Google.";
    if (error.code === 'auth/popup-closed-by-user') {
      msg = "Sign in popup was closed. Please try again.";
    }
    return {
      success: false,
      message: msg
    };
  }
};

/**
 * Real Firebase Authentication Registration
 */
export const registerAdmin = async (
  email: string, 
  pass: string, 
  fullName?: string,
  secretPasskey?: string
): Promise<{ success: boolean; user?: AdminUser; message: string }> => {
  if ((secretPasskey || '').trim() !== ADMIN_CREATE_PASSKEY) {
    return {
      success: false,
      message: "Invalid secret pass key. Admin account creation is not allowed."
    };
  }

  const cleanEmail = email.trim();
  if (!cleanEmail || !pass || pass.length < 6) {
    return {
      success: false,
      message: "Please enter a valid email and a password of at least 6 characters."
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const adminUser: AdminUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || cleanEmail,
      displayName: fullName || cleanEmail.split('@')[0],
      role: 'superadmin'
    };
    setStoredAdminSession(adminUser);

    // Record admin profile directly in Firestore
    try {
      await setDoc(doc(db, "admins", adminUser.uid), {
        uid: adminUser.uid,
        email: adminUser.email,
        displayName: adminUser.displayName,
        role: adminUser.role,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore admin profile write:", e);
    }

    return {
      success: true,
      user: adminUser,
      message: "Administrator account created in Firebase Auth & Firestore!"
    };
  } catch (error: any) {
    console.error("Firebase Auth registration error:", error);
    let msg = error.message || "Failed to register admin account.";
    if (error.code === 'auth/email-already-in-use') {
      msg = "An account already exists with this email in Firebase Auth. Please sign in.";
    } else if (error.code === 'auth/weak-password') {
      msg = "Password should be at least 6 characters long.";
    } else if (error.code === 'auth/invalid-email') {
      msg = "Please enter a valid email address.";
    } else if (error.code === 'auth/operation-not-allowed') {
      msg = "Email/Password provider is not yet enabled in Firebase Console. Please use 'Sign in with Google' or enable Email/Password provider.";
    }

    return {
      success: false,
      message: msg
    };
  }
};

export const registerAdminWithPasskey = registerAdmin;

/**
 * Real Firebase Authentication Sign-in
 */
export const loginAdmin = async (
  email: string, 
  pass: string
): Promise<{ success: boolean; user?: AdminUser; message: string }> => {
  const cleanEmail = email.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const adminUser: AdminUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || cleanEmail,
      displayName: cleanEmail.split('@')[0],
      role: 'superadmin'
    };
    setStoredAdminSession(adminUser);

    // Sync admin record in Firestore
    try {
      await setDoc(doc(db, "admins", adminUser.uid), {
        uid: adminUser.uid,
        email: adminUser.email,
        displayName: adminUser.displayName,
        role: adminUser.role,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore admin touch:", e);
    }

    return {
      success: true,
      user: adminUser,
      message: "Signed in successfully via Firebase Auth!"
    };
  } catch (error: any) {
    console.error("Firebase Auth login error:", error);
    let msg = error.message || "Invalid email or password.";
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      msg = "Invalid email or password. Please check your credentials.";
    } else if (error.code === 'auth/too-many-requests') {
      msg = "Too many failed login attempts. Access temporarily disabled; please try again later or use Google sign-in.";
    } else if (error.code === 'auth/operation-not-allowed') {
      msg = "Email/Password sign-in is disabled. Please use 'Sign in with Google' below.";
    }

    return {
      success: false,
      message: msg
    };
  }
};

/**
 * Real Firebase Auth Sign Out
 */
export const logoutAdmin = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn("Sign out error", e);
  }
  setStoredAdminSession(null);
};
