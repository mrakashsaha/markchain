import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contextAPI/AuthContext";
import LoadingSpiner from "./LoadingSpiner";

const PrivateRoute = ({ children }) => {
  const { account, loading, userInfo } = useContext(AuthContext);
  const location = useLocation();

  // Still checking wallet/user status
  if (loading) {
    return <LoadingSpiner />;
  }

  // 🚫 If wallet not connected → redirect to homepage
  if (!account) {
    return <Navigate to="/" replace />;
  }

  // 🧩 Logic for /register route
  if (location.pathname === "/register") {
    // User already exists
    if (userInfo) {
      if (userInfo.status === "pending") {
        return <Navigate to="/pending" replace />;
      } else if (userInfo.status === "approved") {
        if (userInfo.publicKey === null) {
          return <Navigate to="/private-key" replace />;
        }
        else {
          return <Navigate to="/dashboard" replace />;
        }
      }
      else {
        return <Navigate to="/reject" replace />;
      }
    }
  }

  // 🧩 Logic for /pending route
  if (location.pathname === "/pending") {
    // Only unapproved users can view pending page
    if (!userInfo) {
      return <Navigate to="/register" replace />;
    }

    if (userInfo.status === "approved") {
      return <Navigate to="/dashboard" replace />;
    }

    if (userInfo.status === "rejected") {
      return <Navigate to="/reject" replace />;
    }
  }

  // ✅ Default: allow access
  return children;
};

export default PrivateRoute;
