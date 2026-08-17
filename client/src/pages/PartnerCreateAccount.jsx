import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./PartnerCreateAccount.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

function PartnerCreateAccount() {
  const location = useLocation();
  const navigate = useNavigate();

  /* =========================================================
     SELECTED PLAN
  ========================================================= */

  const params = new URLSearchParams(
    location.search
  );

  const selectedPlan =
    params.get("plan") || "Standard";


  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    phone: "",
    profile_photo: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };


  /* =========================================================
     PROFILE PHOTO
  ========================================================= */

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile photo must be smaller than 5MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((previous) => ({
        ...previous,
        profile_photo: reader.result,
      }));

      setError("");
    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected photo."
      );
    };

    reader.readAsDataURL(file);
  };


  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email address.";
    }

    if (!form.password) {
      return "Please enter a password.";
    }

    if (form.password.length < 6) {
      return (
        "Password must contain at least 6 characters."
      );
    }

    if (!form.company_name.trim()) {
      return "Please enter your company name.";
    }

    if (!selectedPlan.trim()) {
      return "Please select a plan.";
    }

    return "";
  };


  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/auth/partner-signup`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plan_name:
              selectedPlan.trim(),

            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            password:
              form.password,

            company_name:
              form.company_name.trim(),

            phone:
              form.phone.trim() || null,

            profile_photo:
              form.profile_photo || null,
          }),
        }
      );

      /*
       * Protect against HTML/non-JSON responses.
       */
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to submit partner application."
        );
      }

      setSubmitted(true);

    } catch (err) {
      console.error(
        "PARTNER SIGNUP ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to submit your application."
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     SUCCESS SCREEN
  ========================================================= */

  if (submitted) {
    return (
      <div className="create-account-page">

        <div className="create-account-card success-card">

          <div className="success-icon">
            ✓
          </div>

          <span className="create-account-eyebrow">
            APPLICATION SUBMITTED
          </span>

          <h1>
            Your account is under review
          </h1>

          <p>
            Your{" "}
            <strong>
              {selectedPlan}
            </strong>{" "}
            partner application has been
            successfully submitted.
          </p>

          <div className="approval-notice">

            <strong>
              Approval time: up to 24 hours
            </strong>

            <span>
              Our admin team will review
              your details before activating
              your Partner account.
            </span>

          </div>

          <div className="success-email-note">
            <strong>
              Login email
            </strong>

            <span>
              {form.email}
            </span>

            <small>
              Please use this email and your
              password after approval.
            </small>
          </div>

          <button
            type="button"
            className="create-account-login-button"
            onClick={() =>
              navigate("/login")
            }
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }


  /* =========================================================
     CREATE ACCOUNT
  ========================================================= */

  return (
    <div className="create-account-page">

      <div className="create-account-card">

        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="create-account-brand">

          <div className="create-account-brand-mark">
            Z
          </div>

          <div>

            <strong>
              Zaploft
            </strong>

            <span>
              MESSAGE AUTOMATION
            </span>

          </div>

        </div>


        {/* ===================================================
            HEADING
        =================================================== */}

        <div className="create-account-heading">

          <span className="create-account-eyebrow">
            CREATE PARTNER ACCOUNT
          </span>

          <h1>
            Start your workspace
          </h1>

          <p>
            Complete your details to submit
            your partner application.
          </p>

        </div>


        {/* ===================================================
            SELECTED PLAN
        =================================================== */}

        <div className="selected-plan">

          <div>

            <span>
              SELECTED PLAN
            </span>

            <strong>
              {selectedPlan}
            </strong>

          </div>

          <small>
            24h approval
          </small>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="create-account-error">
            <span>!</span>
            {error}
          </div>
        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          className="create-account-form"
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="create-field">

              <label htmlFor="partner-name">
                Full Name
              </label>

              <input
                id="partner-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />

            </div>


            {/* EMAIL */}

            <div className="create-field">

              <label htmlFor="partner-email">
                Email Address
              </label>

              <input
                id="partner-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />

            </div>


            {/* PASSWORD */}

            <div className="create-field">

              <label htmlFor="partner-password">
                Password
              </label>

              <input
                id="partner-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                disabled={loading}
              />

              <small>
                Minimum 6 characters.
              </small>

            </div>


            {/* COMPANY */}

            <div className="create-field">

              <label htmlFor="partner-company">
                Company Name
              </label>

              <input
                id="partner-company"
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Enter your business name"
                autoComplete="organization"
                disabled={loading}
              />

            </div>


            {/* PHONE */}

            <div className="create-field full-width">

              <label htmlFor="partner-phone">
                Phone Number
              </label>

              <input
                id="partner-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={loading}
              />

            </div>

          </div>


          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <div className="signup-photo-section">

            <div className="signup-photo-preview">

              {form.profile_photo ? (
                <img
                  src={form.profile_photo}
                  alt="Profile preview"
                />
              ) : (
                <span>
                  {
                    (
                      form.name ||
                      "P"
                    )
                      .charAt(0)
                      .toUpperCase()
                  }
                </span>
              )}

            </div>

            <div className="signup-photo-content">

              <strong>
                Profile Photo
              </strong>

              <span>
                Optional. JPG, PNG or WEBP.
                Maximum 5MB.
              </span>

              <label className="signup-photo-button">

                Choose Photo

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handlePhotoChange
                  }
                  disabled={loading}
                />

              </label>

            </div>

          </div>


          {/* =================================================
              APPROVAL NOTICE
          ================================================= */}

          <div className="approval-copy">

            <div className="approval-copy-icon">
              ⏱
            </div>

            <div>

              <strong>
                Admin approval required
              </strong>

              <span>
                Your application will be reviewed
                within 24 hours. Your Partner
                Dashboard becomes available only
                after approval.
              </span>

            </div>

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="create-account-submit"
            disabled={loading}
          >
            {loading
              ? "Submitting application..."
              : "Create Partner Account"}
          </button>

        </form>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="create-account-footer">

          <span>
            Already have an approved account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Sign in
          </button>

        </div>

      </div>

    </div>
  );
}

export default PartnerCreateAccount;
