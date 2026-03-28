import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfileName(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        let profileData = {
          displayName:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "User",
          email: currentUser.email || "",
          role: "user",
          photoURL: currentUser.photoURL || "",
        };

        if (snap.exists()) {
          const data = snap.data();

          profileData = {
            displayName:
              data.username ||
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            email: currentUser.email || "",
            role: data.role || "user",
            photoURL: data.photoURL || currentUser.photoURL || "",
          };
        }

        setProfileName(profileData);
      } catch (error) {
        console.error("Auth fetch error:", error);

        setProfileName({
          displayName: "User",
          email: currentUser.email || "",
          role: "user",
          photoURL: "",
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profileName, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
