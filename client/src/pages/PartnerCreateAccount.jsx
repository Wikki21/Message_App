import React, {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "./PartnerCreateAccount.css";


const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";


/* =========================================================
   DEMO MODE


const DEMO_MODE = true;


/* =========================================================
   PLAN LABELS
========================================================= */

const PLAN_LABELS = {
  solo: "Solo",
  pro: "Pro",
  business: "Business",
};


/* =========================================================
   HELPERS
========================================================= */

function getPlanLabel(plan) {
  return (
    PLAN_LABELS[
      String(plan || "")
        .trim()
        .toLowerCase()
    ] ||
    "Partner"
  );
}


function formatAmount(
  amount,
  currency = "INR"
) {
  if (
    amount === undefined ||
    amount === null ||
    amount === ""
  ) {
    return "";
  }

  const numericAmount =
    Number(amount);

  if (
    Number.isNaN(
      numericAmount
    )
  ) {
    return "";
  }

  if (
    currency === "INR"
  ) {
    return numericAmount.toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  return numericAmount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}


/* =========================================================
   DEMO PLAN AMOUNTS
========================================================= */

const DEMO_PLAN_AMOUNTS = {
  solo: 588,
  pro: 4718.82,
  business: 1768.82,
};


/* =========================================================
   INITIAL FORM
========================================================= */

const EMPTY_FORM = {
  name: "",
  email: "",
  company_name: "",
  phone: "",
  password: "",
};


/* =========================================================
   COMPONENT
========================================================= */

function PartnerCreateAccount() {

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const fileInputRef =
    useRef(null);


  /* =======================================================
     PLAN
  ======================================================= */

  const plan =
    (
      searchParams.get(
        "plan"
      ) || "solo"
    )
      .trim()
      .toLowerCase();


  const planLabel =
    getPlanLabel(
      plan
    );


  const demoAmount =
    DEMO_PLAN_AMOUNTS[
      plan
    ] ||
    0;


  /* =======================================================
     STATE
  ======================================================= */

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );


  const [
    profilePhoto,
    setProfilePhoto,
  ] = useState("");


  const [
    profileFile,
    setProfileFile,
  ] = useState(null);


  /*
   * In demo mode payment is
   * automatically treated as verified.
   */
  const [
    paymentInfo,
    setPaymentInfo,
  ] = useState(
    DEMO_MODE
      ? {
          plan,
          planName:
            planLabel,
          amount:
            demoAmount,
          currency:
            "INR",
        }
      : null
  );


  const [
    paymentVerified,
    setPaymentVerified,
  ] = useState(
    DEMO_MODE
  );


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    submitSuccess,
    setSubmitSuccess,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    formMessage,
    setFormMessage,
  ] = useState("");


  /* =======================================================
     DERIVED
  ======================================================= */

  const initials =
    useMemo(() => {

      const name =
        form.name.trim();


      if (!name) {
        return "P";
      }


      return name
        .charAt(0)
        .toUpperCase();

    }, [form.name]);


  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );


      if (error) {
        setError("");
      }


      if (formMessage) {
        setFormMessage("");
      }

    };


  /* =======================================================
     PHOTO
  ======================================================= */

  const handlePhotoChange =
    (event) => {

      const file =
        event.target
          .files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        setError(
          "Please select a JPG, PNG or WEBP image."
        );

        event.target.value =
          "";

        return;
      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        setError(
          "Profile photo must be 5 MB or smaller."
        );

        event.target.value =
          "";

        return;
      }


      setError("");


      setProfileFile(
        file
      );


      const reader =
        new FileReader();


      reader.onload =
        () => {

          setProfilePhoto(
            String(
              reader.result ||
                ""
            )
          );

        };


      reader.onerror =
        () => {

          setError(
            "Failed to read profile photo."
          );

        };


      reader.readAsDataURL(
        file
      );

    };


  /* =======================================================
     REMOVE PHOTO
  ======================================================= */

  const handleRemovePhoto =
    () => {

      setProfilePhoto("");

      setProfileFile(
        null
      );


      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }

    };


  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm =
    () => {

      const name =
        form.name.trim();

      const email =
        form.email
          .trim()
          .toLowerCase();

      const company =
        form.company_name.trim();

      const phone =
        form.phone.trim();

      const password =
        form.password;


      if (!name) {
        return "Full name is required.";
      }


      if (
        name.length >
        150
      ) {
        return "Full name must be 150 characters or less.";
      }


      if (!email) {
        return "Email address is required.";
      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          email
        )
      ) {

        return "Please enter a valid email address.";

      }


      if (!company) {
        return "Company name is required.";
      }


      if (
        company.length >
        255
      ) {

        return "Company name must be 255 characters or less.";

      }


      if (
        phone.length >
        30
      ) {

        return "Phone number must be 30 characters or less.";

      }


      if (!password) {
        return "Password is required.";
      }


      if (
        password.length <
        6
      ) {

        return "Password must contain at least 6 characters.";

      }


      /*
       * Only enforce payment when
       * demo mode is disabled.
       */
      if (
        !DEMO_MODE &&
        !paymentVerified
      ) {

        return "A verified payment is required before creating an account.";

      }


      return "";

    };


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      setError("");

      setFormMessage("");


      const validationError =
        validateForm();


      if (
        validationError
      ) {

        setError(
          validationError
        );

        return;
      }


      try {

        setSubmitting(
          true
        );


        /*
         * ===================================================
         * DEMO MODE
         *
         * For today's demo we don't call
         * the real payment-protected API.
         *
         * We simply demonstrate the full
         * application-submission flow.
         * ===================================================
         */

        if (
          DEMO_MODE
        ) {

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                900
              )
          );


          setSubmitSuccess(
            true
          );


          setFormMessage(
            "Partner application submitted successfully."
          );


          setForm(
            (previous) => ({
              ...previous,
              password: "",
            })
          );


          return;
        }


        /*
         * ===================================================
         * PRODUCTION FLOW
         *
         * This block will be used again
         * when Razorpay payment is enabled.
         * ===================================================
         */

        const paymentToken =
          searchParams.get(
            "payment_token"
          );


        if (
          !paymentToken
        ) {

          throw new Error(
            "Payment token is missing."
          );

        }


        const response =
          await fetch(
            `${API_BASE}/api/auth/partner-signup`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify({
                  payment_token:
                    paymentToken,

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
                    form.phone.trim() ||
                    null,

                  profile_photo:
                    profilePhoto ||
                    null,
                }),
            }
          );


        const responseText =
          await response.text();


        let data =
          null;


        try {

          data =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;

        } catch {

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
              `Failed to submit partner application. (${response.status})`
          );

        }


        setSubmitSuccess(
          true
        );


        setFormMessage(
          data?.message ||
            "Partner application submitted successfully."
        );


        setForm(
          (previous) => ({
            ...previous,
            password: "",
          })
        );

      } catch (err) {

        console.error(
          "PARTNER SIGNUP ERROR:",
          err
        );


        setError(
          err.message ||
            "Failed to submit partner application."
        );

      } finally {

        setSubmitting(
          false
        );

      }

    };


  /* =======================================================
     SUCCESS PAGE
  ======================================================= */

  if (
    submitSuccess
  ) {

    return (
      <div className="partner-create-page">

        <div className="partner-create-success-card">

          <div className="partner-success-icon">
            ✓
          </div>


          <div className="partner-success-plan">
            {planLabel} PLAN
          </div>


          <h1>
            Application submitted
          </h1>


          <p>
            Your partner account application has
            been submitted successfully and is
            now waiting for admin approval.
          </p>


          <div className="partner-success-note">

            <strong>
              What happens next?
            </strong>


            <span>
              The Zaploft admin team will review
              your profile. Once approved, your
              Partner account will be created and
              you can log in using your email and
              password.
            </span>

          </div>


          <div className="partner-success-email">

            <span>
              Login email
            </span>


            <strong>
              {form.email}
            </strong>

          </div>


          <button
            type="button"
            className="partner-primary-button"
            onClick={() =>
              navigate(
                "/login"
              )
            }
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="partner-create-page">

      <div className="partner-create-container">

        {/* =================================================
            DEMO BAR
        ================================================= */}

        {DEMO_MODE && (
          <div
            style={{
              marginBottom:
                "16px",

              padding:
                "10px 14px",

              borderRadius:
                "10px",

              background:
                "#fff7ed",

              border:
                "1px solid #fed7aa",

              color:
                "#9a3412",

              fontSize:
                "12px",

              fontWeight:
                600,

              textAlign:
                "center",
            }}
          >
            DEMO MODE — Payment verification is temporarily skipped.
          </div>
        )}


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="partner-create-header">

          <div className="partner-create-brand">

            <div className="partner-create-brand-mark">
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


          <button
            type="button"
            className="partner-header-back"
            onClick={() =>
              navigate(
                "/"
              )
            }
          >
            ← Back to Zaploft
          </button>

        </header>


        {/* =================================================
            TITLE
        ================================================= */}

        <section className="partner-create-intro">

          <span className="partner-create-eyebrow">
            PARTNER REGISTRATION
          </span>


          <h1>
            Create your partner account
          </h1>


          <p>
            You're registering for the{" "}
            <strong>
              {planLabel}
            </strong>{" "}
            plan. Complete your profile below
            to submit your application for admin
            approval.
          </p>

        </section>


        {/* =================================================
            PAYMENT / PLAN SUMMARY
        ================================================= */}

        <section className="partner-payment-confirmed">

          <div className="partner-payment-check">
            ✓
          </div>


          <div className="partner-payment-copy">

            <strong>
              Selected Plan
            </strong>


            <span>
              {planLabel} Plan
              {paymentInfo?.amount
                ? ` · ${formatAmount(
                    paymentInfo.amount,
                    paymentInfo.currency
                  )}`
                : ""}
            </span>

          </div>


          <span className="partner-payment-status">
            SELECTED
          </span>

        </section>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="partner-create-card"
          onSubmit={
            handleSubmit
          }
        >

          <div className="partner-create-card-header">

            <div>

              <h2>
                Partner Profile
              </h2>


              <p>
                Enter the details you want to
                submit for approval.
              </p>

            </div>


            <div className="partner-create-plan-badge">
              {planLabel}
            </div>

          </div>


          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <section className="partner-photo-section">

            <div className="partner-photo-preview">

              {profilePhoto ? (

                <img
                  src={
                    profilePhoto
                  }
                  alt="Profile preview"
                />

              ) : (

                <span>
                  {initials}
                </span>

              )}

            </div>


            <div className="partner-photo-details">

              <strong>
                Profile Photo
              </strong>


              <p>
                JPG, PNG or WEBP.
                Maximum size 5MB.
              </p>


              <div className="partner-photo-actions">

                <button
                  type="button"
                  className="partner-secondary-button"
                  onClick={() =>
                    fileInputRef
                      .current
                      ?.click()
                  }
                >
                  {profilePhoto
                    ? "Change Photo"
                    : "Upload Photo"}
                </button>


                {profilePhoto && (

                  <button
                    type="button"
                    className="partner-remove-photo"
                    onClick={
                      handleRemovePhoto
                    }
                  >
                    Remove
                  </button>

                )}

              </div>


              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePhotoChange
                }
                hidden
              />

            </div>

          </section>


          {/* =================================================
              FORM GRID
          ================================================= */}

          <div className="partner-create-form-grid">

            {/* NAME */}

            <div className="partner-create-field">

              <label htmlFor="partner-name">
                Full Name
              </label>


              <input
                id="partner-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                maxLength={150}
                autoComplete="name"
              />

            </div>


            {/* EMAIL */}

            <div className="partner-create-field">

              <label htmlFor="partner-email">
                Email Address
              </label>


              <input
                id="partner-email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                autoComplete="email"
              />


              <small>
                This email will be used for your
                Partner login.
              </small>

            </div>


            {/* COMPANY */}

            <div className="partner-create-field">

              <label htmlFor="partner-company">
                Company Name
              </label>


              <input
                id="partner-company"
                name="company_name"
                type="text"
                placeholder="Enter your company name"
                value={
                  form.company_name
                }
                onChange={
                  handleChange
                }
                maxLength={255}
                autoComplete="organization"
              />

            </div>


            {/* PHONE */}

            <div className="partner-create-field">

              <label htmlFor="partner-phone">

                Phone Number

                <span>
                  Optional
                </span>

              </label>


              <input
                id="partner-phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                maxLength={30}
                autoComplete="tel"
              />

            </div>


            {/* PASSWORD */}

            <div className="partner-create-field partner-create-field-full">

              <label htmlFor="partner-password">
                Password
              </label>


              <input
                id="partner-password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                minLength={6}
                autoComplete="new-password"
              />


              <small>
                Minimum 6 characters.
              </small>

            </div>

          </div>


          {/* =================================================
              APPROVAL INFO
          ================================================= */}

          <div className="partner-create-info">

            <div className="partner-create-info-icon">
              !
            </div>


            <div>

              <strong>
                Admin approval required
              </strong>


              <p>
                After you submit this form, your
                account will remain pending until a
                Zaploft administrator reviews and
                approves your details.
              </p>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="partner-create-alert error">

              <span>
                !
              </span>


              <div>
                {error}
              </div>

            </div>

          )}


          {/* =================================================
              MESSAGE
          ================================================= */}

          {formMessage && (

            <div className="partner-create-alert success">

              <span>
                ✓
              </span>


              <div>
                {formMessage}
              </div>

            </div>

          )}


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="partner-create-actions">

            <button
              type="button"
              className="partner-cancel-button"
              onClick={() =>
                navigate(
                  "/"
                )
              }
              disabled={
                submitting
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="partner-primary-button"
              disabled={
                submitting
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit for Approval"}
            </button>

          </div>


          {/* =================================================
              FOOTER NOTE
          ================================================= */}

          <div className="partner-create-footer-note">

            <span>
              🔒
            </span>


            <span>
              Your information is securely stored
              and reviewed by Zaploft.
            </span>

          </div>

        </form>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="partner-create-footer">

          <span>
            ©{" "}
            {new Date().getFullYear()}{" "}
            Zaploft
          </span>


          <span>
            Message Automation Platform
          </span>

        </footer>

      </div>

    </div>
  );
}


export default PartnerCreateAccount;
