import React, {
  useEffect,
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
     PAYMENT / PLAN
  ======================================================= */

  const plan =
    (
      searchParams.get(
        "plan"
      ) || ""
    )
      .trim()
      .toLowerCase();


  const paymentToken =
    (
      searchParams.get(
        "payment_token"
      ) || ""
    ).trim();


  const planLabel =
    getPlanLabel(plan);


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


  const [
    paymentInfo,
    setPaymentInfo,
  ] = useState(null);


  const [
    verifyingPayment,
    setVerifyingPayment,
  ] = useState(true);


  const [
    paymentVerified,
    setPaymentVerified,
  ] = useState(false);


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
     DERIVED VALUES
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
     VERIFY PAYMENT BEFORE SHOWING FORM
  ======================================================= */

  useEffect(() => {
    let cancelled = false;


    const verifyPayment =
      async () => {
        try {
          setVerifyingPayment(
            true
          );

          setError("");

          /*
           * No plan or no payment token:
           * user is not allowed to access
           * the account creation page.
           */
          if (
            !plan ||
            !paymentToken
          ) {
            navigate(
              `/payment?plan=${encodeURIComponent(
                plan || "solo"
              )}`,
              {
                replace: true,
              }
            );

            return;
          }


          const response =
            await fetch(
              `${API_BASE}/api/payment/verify-token/${encodeURIComponent(
                paymentToken
              )}`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );


          const data =
            await response.json();


          if (
            cancelled
          ) {
            return;
          }


          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                "Unable to verify payment."
            );
          }


          /*
           * Payment must be PAID.
           */
          if (
            !data.paid
          ) {
            navigate(
              `/payment?plan=${encodeURIComponent(
                plan
              )}`,
              {
                replace: true,
              }
            );

            return;
          }


          /*
           * Token is single-use.
           */
          if (
            data.used
          ) {
            throw new Error(
              "This payment has already been used for an application."
            );
          }


          /*
           * Make sure the payment's
           * plan matches the URL plan.
           */
          const paymentPlan =
            String(
              data.payment?.plan ||
                ""
            )
              .trim()
              .toLowerCase();


          if (
            paymentPlan &&
            paymentPlan !== plan
          ) {
            throw new Error(
              "The selected plan does not match the verified payment."
            );
          }


          setPaymentInfo(
            data.payment || null
          );

          setPaymentVerified(
            true
          );

        } catch (err) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "VERIFY PAYMENT ERROR:",
            err
          );

          setPaymentVerified(
            false
          );

          setError(
            err.message ||
              "Unable to verify payment."
          );

        } finally {
          if (
            !cancelled
          ) {
            setVerifyingPayment(
              false
            );
          }
        }
      };


    verifyPayment();


    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    paymentToken,
    plan,
  ]);


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


      if (
        error
      ) {
        setError("");
      }

      if (
        formMessage
      ) {
        setFormMessage("");
      }
    };


  /* =======================================================
     PHOTO SELECT
  ======================================================= */

  const handlePhotoChange =
    (event) => {
      const file =
        event.target
          .files?.[0];


      if (!file) {
        return;
      }


      /*
       * Allow only images.
       */
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


      /*
       * Maximum 5 MB.
       */
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


      /*
       * Basic email validation.
       */
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
       * Extra protection:
       * signup is impossible without
       * verified payment.
       */
      if (
        !paymentVerified ||
        !paymentToken
      ) {
        return "A verified payment is required before creating an account.";
      }


      return "";
    };


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (event) => {
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


        const response =
          await fetch(
            `${API_BASE}/api/auth/partner-signup`,
            {
              method: "POST",

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


        /*
         * Some server failures can return
         * HTML instead of JSON.
         *
         * Read text first so the UI doesn't
         * throw "Unexpected token <".
         */
        const responseText =
          await response.text();


        let data = null;


        try {
          data =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;
        } catch {
          data = null;
        }


        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              `Failed to submit partner application. (${response.status})`
          );
        }


        /*
         * Success.
         */
        setSubmitSuccess(
          true
        );

        setFormMessage(
          data?.message ||
            "Your partner application has been submitted successfully."
        );


        /*
         * Clear password after submit.
         */
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
     LOADING
  ======================================================= */

  if (
    verifyingPayment
  ) {
    return (
      <div className="partner-create-page">

        <div className="partner-create-loading-card">

          <div className="partner-create-loading-icon">
            <span />
          </div>

          <h2>
            Verifying your payment
          </h2>

          <p>
            Please wait while we verify your
            Razorpay payment.
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     PAYMENT ERROR
  ======================================================= */

  if (
    !paymentVerified
  ) {
    return (
      <div className="partner-create-page">

        <div className="partner-create-error-card">

          <div className="partner-create-error-icon">
            !
          </div>

          <h2>
            Account creation unavailable
          </h2>

          <p>
            {error ||
              "A verified payment is required before creating your partner account."}
          </p>

          <button
            type="button"
            className="partner-primary-button"
            onClick={() =>
              navigate(
                `/payment?plan=${encodeURIComponent(
                  plan || "solo"
                )}`
              )
            }
          >
            Go to Payment
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     SUCCESS
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
            Your payment has been verified and
            your partner account application has
            been sent to the Zaploft admin team.
          </p>

          <div className="partner-success-note">

            <strong>
              What happens next?
            </strong>

            <span>
              The admin will review your company
              and profile details. Once approved,
              your partner account will be created
              and you can log in using your email
              and password.
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

        {/* ===================================================
            HEADER
        =================================================== */}

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


        {/* ===================================================
            TITLE
        =================================================== */}

        <section className="partner-create-intro">

          <span className="partner-create-eyebrow">
            PARTNER REGISTRATION
          </span>

          <h1>
            Create your partner account
          </h1>

          <p>
            Your payment has been verified.
            Complete your profile below to submit
            your application for admin approval.
          </p>

        </section>


        {/* ===================================================
            PAYMENT SUMMARY
        =================================================== */}

        <section className="partner-payment-confirmed">

          <div className="partner-payment-check">
            ✓
          </div>

          <div className="partner-payment-copy">

            <strong>
              Payment verified
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
            PAID
          </span>

        </section>


        {/* ===================================================
            FORM CARD
        =================================================== */}

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
                    fileInputRef.current?.click()
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

              <div className="partner-email-wrapper">

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

                <span className="partner-email-lock">
                  🔒
                </span>

              </div>

              <small>
                This email will be used for your
                partner login.
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
              IMPORTANT INFORMATION
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
                submitting ||
                !paymentVerified
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit for Approval"}
            </button>

          </div>


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


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="partner-create-footer">

          <span>
            © {new Date().getFullYear()} Zaploft
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
