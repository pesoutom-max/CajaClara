'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { UserRole } from './user-profiles';

const USER_CREATION_APP_NAME = 'user-creation-app';

interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdBy: string;
}

/**
 * Creates a new user account in Firebase Authentication and a corresponding user profile in Firestore.
 * This function uses a secondary Firebase app instance to perform the user creation,
 * ensuring that the currently logged-in administrator's session is not affected.
 *
 * @param params - The user details required for creation.
 * @throws Will throw an error if user creation in Auth or Firestore document creation fails.
 */
export async function createUserAccount(params: CreateUserParams): Promise<void> {
  const { email, password, name, role, createdBy } = params;

  // 1. Initialize a secondary Firebase app instance to avoid session conflicts.
  // This allows creating a new user without signing out the current admin.
  let secondaryApp;
  if (!getApps().some(app => app.name === USER_CREATION_APP_NAME)) {
    secondaryApp = initializeApp(firebaseConfig, USER_CREATION_APP_NAME);
  } else {
    secondaryApp = getApp(USER_CREATION_APP_NAME);
  }

  const secondaryAuth = getAuth(secondaryApp);
  const mainFirestore = getFirestore(); // Use the main app's Firestore instance

  try {
    // 2. Create the user in Firebase Authentication using the secondary app.
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUserUid = userCredential.user.uid;

    // 3. Create the user profile document in Firestore.
    const userDocRef = doc(mainFirestore, 'users', newUserUid);
    await setDoc(userDocRef, {
      name: name,
      email: email,
      role: role,
      isActive: true,
      mustChangePassword: true, // Force password change on first login for security.
      createdAt: serverTimestamp(),
      createdBy: createdBy,
    });

  } catch (error) {
    // If an error occurs, re-throw it to be handled by the calling UI component.
    console.error("Error creating user account:", error);
    throw error;
  } finally {
    // 4. Always sign out the newly created user from the secondary app instance.
    // This is crucial to clean up the temporary session.
    if (secondaryAuth.currentUser) {
      await signOut(secondaryAuth);
    }
    // Optional: Delete the secondary app instance if it's no longer needed,
    // to free up resources. This is safe to do.
    await deleteApp(secondaryApp);
  }
}
