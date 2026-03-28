import React, { useState } from "react";
import LoginModal from "../Auth/LoginModal";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(!user);

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