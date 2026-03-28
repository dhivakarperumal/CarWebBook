import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data());
        } else {
          setUser({ username: currentUser.displayName || "User", role: "user" });
        }
      } else {
        setUser(null);
setShowLogin(true); // 🔥 open login popup
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
  return <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />;
}

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 text-center text-red-600">
        You are not authorized to view this page
      </div>
    );
  }

  return children;
};

export default PrivateRoute;