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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ind_local_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(() => {
    try {
      const saved = localStorage.getItem('ind_local_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isUserAdmin(parsed.email)) {
          return {
            userId: parsed.uid,
            userEmail: parsed.email,
            unlockedPacks: ['elite', 'pro', 'dev', 'roblox', 'creator', 'gaming'],
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // If local user is active, skip waiting on firebase auth state
    if (localStorage.getItem('ind_local_user')) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!localStorage.getItem('ind_local_user')) {
        setUser(currentUser);
      }
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

    if (user.uid.startsWith('local_')) {
      if (isUserAdmin(user.email)) {
        setEntitlement({
          userId: user.uid,
          userEmail: user.email || '',
          unlockedPacks: ['elite', 'pro', 'dev', 'roblox', 'creator', 'gaming'],
        });
      }
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
    localStorage.removeItem('ind_local_user');
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
