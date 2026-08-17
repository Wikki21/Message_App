import React from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const {
    isAuthenticated,
    role,
  } = useAuth();

  const location = useLocation();

  /* =======================================================
     NOT AUTHENTICATED
  ======================================================= */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }


  /* =======================================================
     NORMALIZE ROLE
  ======================================================= */

  const currentRole = String(
    role || ""
  )
    .trim()
    .toUpperCase();


  const allowed = allowedRoles.map((item) =>
    String(item)
      .trim()
      .toUpperCase()
  );


  /* =======================================================
     ROLE NOT ALLOWED
  ======================================================= */

  if (
    allowed.length > 0 &&
    !allowed.includes(currentRole)
  ) {
    if (currentRole === "ADMIN") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    if (currentRole === "PARTNER") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* =======================================================
     CHILDREN MODE
  ======================================================= */

  if (children) {
    return children;
  }


  /* =======================================================
     NESTED ROUTE MODE
  ======================================================= */

  return <Outlet />;
}


export default ProtectedRoute;