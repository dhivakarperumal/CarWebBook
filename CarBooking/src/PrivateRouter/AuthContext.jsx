import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (token && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        setUser(storedUser);
        setProfileName({
          displayName:
            storedUser.username ||
            storedUser.email?.split("@")[0] ||
            "User",
          email: storedUser.email || "",
          role: storedUser.role || "user",
          photoURL: storedUser.photoURL || "",
        });
      } catch (error) {
        setUser(null);
        setProfileName(null);
      }
    } else {
      setUser(null);
      setProfileName(null);
    }
    setLoading(false);
  };

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    checkAuth();
  };

  const logoutContext = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profileName, login, logout: logoutContext }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
