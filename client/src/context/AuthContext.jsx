import React, {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";


export function AuthProvider({ children }) {

  /* =======================================================
     LOAD SAVED USER
  ======================================================= */

  const [user, setUser] = useState(() => {

    try {

      return JSON.parse(
        localStorage.getItem("user") || "null"
      );

    } catch {

      return null;

    }

  });


  /* =======================================================
     LOAD SAVED TOKEN
  ======================================================= */

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );


  /* =======================================================
     AUTH STATE
  ======================================================= */

  const isAuthenticated =
    Boolean(token && user);


  const role =
    user?.role || null;


  /* =======================================================
     LOGIN

     Login.jsx calls:

     login(email, password)

     Backend:

     POST /api/auth/login
  ======================================================= */

  const login = async (email, password) => {

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!email || !email.trim()) {

      throw new Error(
        "Email and password are required."
      );

    }

    if (!password) {

      throw new Error(
        "Email and password are required."
      );

    }


    /* -----------------------------------------------------
       API REQUEST
    ----------------------------------------------------- */

    const response = await fetch(
      `${API_BASE}/api/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );


    /* -----------------------------------------------------
       READ RESPONSE
    ----------------------------------------------------- */

    let data;

    try {

      data = await response.json();

    } catch {

      throw new Error(
        "Invalid response from server."
      );

    }


    /* -----------------------------------------------------
       SERVER ERROR
    ----------------------------------------------------- */

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Invalid email or password."
      );

    }


    /* -----------------------------------------------------
       VALIDATE LOGIN RESPONSE
    ----------------------------------------------------- */

    if (!data.token) {

      throw new Error(
        "Login token was not returned by the server."
      );

    }


    if (!data.user) {

      throw new Error(
        "User information was not returned by the server."
      );

    }


    /* -----------------------------------------------------
       NORMALIZE ROLE
    ----------------------------------------------------- */

    const normalizedUser = {
      ...data.user,

      role: String(
        data.user.role || ""
      ).toUpperCase(),
    };


    /* -----------------------------------------------------
       VALIDATE ROLE

       Only these two roles can enter dashboard.
    ----------------------------------------------------- */

    if (
      normalizedUser.role !== "ADMIN" &&
      normalizedUser.role !== "PARTNER"
    ) {

      throw new Error(
        "Unknown user role."
      );

    }


    /* -----------------------------------------------------
       SAVE AUTH DATA
    ----------------------------------------------------- */

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(normalizedUser)
    );


    /* -----------------------------------------------------
       UPDATE REACT STATE
    ----------------------------------------------------- */

    setToken(data.token);

    setUser(normalizedUser);


    /* -----------------------------------------------------
       RETURN USER

       Login.jsx can now safely do:

       const loggedInUser = await login(
         email,
         password
       );
    ----------------------------------------------------- */

    return normalizedUser;
  };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setToken(null);

    setUser(null);
  };


  /* =======================================================
     AUTH VALUE
  ======================================================= */

  const value = {

    user,

    token,

    role,

    isAuthenticated,

    login,

    logout,

  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


/* =========================================================
   HOOK
========================================================= */

export function useAuth() {

  const context = useContext(
    AuthContext
  );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider."
    );

  }


  return context;
}


export default AuthContext;
