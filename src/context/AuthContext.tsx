import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db, isUserAdmin, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../firebase';
import { PackId, UserEntitlement } from '../types';

interface AuthContextType {
  user: User | null;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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
    try {
      const signedInUser = await loginWithGoogle();
      return signedInUser || undefined;
    } catch {
      return undefined;
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
    setEntitlement(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
