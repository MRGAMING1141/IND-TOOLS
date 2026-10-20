import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isUserAdmin, logoutUser, handleFirestoreError, OperationType } from '../firebase';
import { PackId, UserEntitlement } from '../types';
import { generateSpecialUid } from '../utils/uidHelper';
import { AuthModal } from '../components/AuthModal';

interface AuthContextType {
  user: User | null;
  specialUid: string;
  loading: boolean;
  isAdmin: boolean;
  entitlement: UserEntitlement | null;
  unlockedPacks: PackId[];
  hasAccessToPack: (pack?: PackId) => boolean;
  signIn: () => Promise<User | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  specialUid: 'IND-0000-0000',
  loading: true,
  isAdmin: false,
  entitlement: null,
  unlockedPacks: [],
  hasAccessToPack: () => false,
  signIn: async () => undefined,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          const sUid = generateSpecialUid(currentUser.uid);
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            {
              uid: currentUser.uid,
              specialUid: sUid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'IND HUB Member',
              photoURL: currentUser.photoURL || '',
              lastLoginAt: serverTimestamp(),
              lastLoginMillis: Date.now(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('User profile sync skipped/handled:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to the user's entitlements
  useEffect(() => {
    if (!user) {
      setEntitlement(null);
      return;
    }

    const docPath = `user_entitlements/${user.uid}`;
    const entRef = doc(db, 'user_entitlements', user.uid);

    const unsub = onSnapshot(
      entRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEntitlement(snapshot.data() as UserEntitlement);
        } else {
          setEntitlement(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );

    return () => unsub();
  }, [user]);

  const isAdmin = isUserAdmin(user?.email);
  const unlockedPacks = entitlement?.unlockedPacks || [];

  const hasAccessToPack = (pack?: PackId): boolean => {
    if (!pack) return true; // Free tool
    if (isAdmin) return true; // Admins have full access to evaluate tools
    if (unlockedPacks.includes('elite')) return true; // Elite includes everything
    if (pack === 'pro' && unlockedPacks.includes('pro')) return true;
    if (unlockedPacks.includes(pack)) return true;
    return false;
  };

  const signIn = async () => {
    setAuthModalOpen(true);
    return undefined;
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    setUser(null);
    setEntitlement(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        specialUid: user ? generateSpecialUid(user.uid) : 'IND-0000-0000',
        loading,
        isAdmin,
        entitlement,
        unlockedPacks,
        hasAccessToPack,
        signIn,
        signOut,
      }}
    >
      {children}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
