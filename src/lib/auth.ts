import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db, OperationType, handleFirestoreError } from "./firebase";
import { AdminProfile, AdminRole, OperationResult } from "./types";

// The project owner has initial bootstrap authorization
export const PROJECT_OWNER_EMAIL = "syedmohammad201037@gmail.com";

/**
 * Signs in administrator using verified Firebase Authentication and checks their Firestore role
 */
export async function loginAdmin(
  email: string, 
  pass: string
): Promise<OperationResult<AdminProfile>> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = userCredential.user;

    // Check Firestore admin profile in /admins/{uid}
    const adminDocRef = doc(db, "admins", user.uid);
    let adminDocSnap;
    try {
      adminDocSnap = await getDoc(adminDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`);
    }

    if (adminDocSnap && adminDocSnap.exists()) {
      const data = adminDocSnap.data() as AdminProfile;
      return {
        success: true,
        data: {
          uid: user.uid,
          email: user.email || email,
          displayName: data.displayName || email.split('@')[0],
          role: data.role || 'coordinator'
        },
        message: "Signed in successfully as authorized administrator."
      };
    }

    // First-time owner bootstrap: if the logged-in user is the project owner, bootstrap as superadmin
    if (user.email?.toLowerCase() === PROJECT_OWNER_EMAIL.toLowerCase()) {
      const ownerProfile: AdminProfile = {
        uid: user.uid,
        email: user.email,
        displayName: "Camp Super Admin",
        role: "superadmin"
      };

      try {
        await setDoc(adminDocRef, {
          ...ownerProfile,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `admins/${user.uid}`);
      }

      return {
        success: true,
        data: ownerProfile,
        message: "Welcome Super Admin! Initial administrative profile provisioned."
      };
    }

    // User is authenticated in Firebase Auth, but NOT listed in /admins collection
    await fbSignOut(auth);
    return {
      success: false,
      error: "Access Denied: Your account is not authorized as a camp administrator. Contact the Super Admin."
    };
  } catch (error: any) {
    let msg = error?.message || "Invalid credentials.";
    if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
      msg = "Invalid administrator email or password.";
    } else if (error?.code === 'auth/too-many-requests') {
      msg = "Too many failed login attempts. Please wait a few moments before trying again.";
    }
    return {
      success: false,
      error: msg
    };
  }
}

/**
 * Signs out administrator
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn("Sign out error", err);
  }
}

/**
 * Subscribes to real Firebase Auth state and verifies the user's role from Firestore
 */
export function subscribeToAdminAuth(
  callback: (admin: AdminProfile | null, loading: boolean) => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null, false);
      return;
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        const data = adminDocSnap.data() as AdminProfile;
        callback({
          uid: user.uid,
          email: user.email || '',
          displayName: data.displayName || user.email?.split('@')[0],
          role: data.role || 'coordinator'
        }, false);
        return;
      }

      // Check project owner bootstrap
      if (user.email?.toLowerCase() === PROJECT_OWNER_EMAIL.toLowerCase()) {
        const ownerProfile: AdminProfile = {
          uid: user.uid,
          email: user.email,
          displayName: "Camp Super Admin",
          role: "superadmin"
        };
        await setDoc(adminDocRef, {
          ...ownerProfile,
          createdAt: serverTimestamp()
        });
        callback(ownerProfile, false);
        return;
      }

      // Not an admin
      callback(null, false);
    } catch (err) {
      console.warn("Admin profile verification notice:", err);
      callback(null, false);
    }
  });
}

/**
 * Superadmin function: Provisions a new coordinator or superadmin profile in Firestore
 */
export async function createAdminAccount(
  email: string,
  pass: string,
  displayName: string,
  role: AdminRole
): Promise<OperationResult<AdminProfile>> {
  if (!auth.currentUser) {
    return { success: false, error: "Only authenticated administrators can manage team members." };
  }

  try {
    // Note: Creating a user via client SDK signs in the new user in that client.
    // For admin portal team member invites: create secondary client or store invitation in /admins
    // We register in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const newUid = cred.user.uid;

    const newProfile: AdminProfile = {
      uid: newUid,
      email: email.trim(),
      displayName: displayName.trim() || email.split('@')[0],
      role
    };

    const adminDocRef = doc(db, "admins", newUid);
    await setDoc(adminDocRef, {
      ...newProfile,
      createdAt: serverTimestamp()
    });

    return {
      success: true,
      data: newProfile,
      message: `Account created for ${displayName} as ${role}.`
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to create administrator profile."
    };
  }
}

/**
 * Lists all registered administrators from Firestore (restricted to admins)
 */
export async function listAdministrators(): Promise<AdminProfile[]> {
  try {
    const colRef = collection(db, "admins");
    const snap = await getDocs(colRef);
    const list: AdminProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AdminProfile);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "admins");
  }
}

/**
 * Removes an administrator profile (restricted to superadmin)
 */
export async function deleteAdministrator(uid: string): Promise<OperationResult> {
  if (auth.currentUser?.uid === uid) {
    return { success: false, error: "You cannot remove your own administrator account." };
  }

  try {
    const docRef = doc(db, "admins", uid);
    await deleteDoc(docRef);
    return { success: true, message: "Administrator removed." };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
  }
}
