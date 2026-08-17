import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./Login.css";


function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();


  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOGIN
  ======================================================= */

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");


    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!email.trim()) {

      setError(
        "Please enter your email."
      );

      return;

    }


    if (!password) {

      setError(
        "Please enter your password."
      );

      return;

    }


    try {

      setLoading(true);


      /* ---------------------------------------------------
         AUTH CONTEXT HANDLES API LOGIN

         IMPORTANT:

         login(email, password)

         NOT:

         login(data)
      --------------------------------------------------- */

      const loggedInUser =
        await login(
          email.trim(),
          password
        );


      /* ---------------------------------------------------
         ADMIN
      --------------------------------------------------- */

      if (
        loggedInUser.role === "ADMIN"
      ) {

        navigate(
          "/admin/dashboard",
          {
            replace: true,
          }
        );

        return;

      }


      /* ---------------------------------------------------
         PARTNER
      --------------------------------------------------- */

      if (
        loggedInUser.role === "PARTNER"
      ) {

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return;

      }


      /* ---------------------------------------------------
         UNKNOWN ROLE
      --------------------------------------------------- */

      throw new Error(
        "Unknown user role."
      );


    } catch (err) {

      console.error(
        "Login error:",
        err
      );


      setError(
        err.message ||
        "Unable to login. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  return (
    <div className="login-page">

      <div className="login-card">


        {/* =================================================
            BRAND
        ================================================= */}

        <div className="login-brand">

          <div className="login-brand-mark">
            Z
          </div>

          <div>

            <h1>
              Zaploft
            </h1>

            <p>
              MESSAGE AUTOMATION
            </p>

          </div>

        </div>


        {/* =================================================
            HEADING
        ================================================= */}

        <div className="login-heading">

          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to your Zaploft dashboard
          </p>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="login-error">
            {error}
          </div>

        )}


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >


          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="login-field">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="login-field">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign in"}

          </button>


        </form>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="login-footer">

          Zaploft · Message Automation

        </div>


      </div>

    </div>
  );
}


export default Login;
