import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

import "./PartnerSettings.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

function PartnerSettings() {
  const { user, token } = useAuth();

  const fileInputRef = useRef(null);

  /* =========================================================
     PROFILE STATE
  ========================================================= */

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company_name: user?.company_name || "",
    phone: user?.phone || "",
    profile_photo: user?.profile_photo || "",
  });

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [pendingRequest, setPendingRequest] =
    useState(null);

  /* =========================================================
     AUTH TOKEN
  ========================================================= */

  const getToken = () => {
    return (
      token ||
      localStorage.getItem("token") ||
      ""
    );
  };

  /* =========================================================
     PREFILL FROM AUTH CONTEXT
  ========================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((previous) => ({
      ...previous,

      name:
        user.name ??
        previous.name ??
        "",

      email:
        user.email ??
        previous.email ??
        "",

      company_name:
        user.company_name ??
        previous.company_name ??
        "",

      phone:
        user.phone ??
        previous.phone ??
        "",

      profile_photo:
        user.profile_photo ??
        previous.profile_photo ??
        "",
    }));
  }, [user]);

  /* =========================================================
     LOAD APPROVED PROFILE FROM BACKEND
  ========================================================= */

  const loadProfile = async () => {
    try {
      setLoading(true);

      const authToken = getToken();

      if (!authToken) {
        throw new Error(
          "Login session not found."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/partner/profile-request`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load profile."
        );
      }

      if (data.success && data.user) {
        const partner = data.user;

        setProfile({
          name: partner.name || "",
          email: partner.email || "",
          company_name:
            partner.company_name || "",
          phone: partner.phone || "",
          profile_photo:
            partner.profile_photo || "",
        });
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data,
          "pending_request"
        )
      ) {
        setPendingRequest(
          data.pending_request
        );
      }
    } catch (error) {
      console.error(
        "LOAD PROFILE ERROR:",
        error
      );

      /*
       * Do not clear the prefilled user data.
       * AuthContext values remain visible.
       */
      setMessage({
        type: "error",
        text:
          "Could not refresh profile from the server. Your current saved details are shown.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD PROFILE REQUESTS
  ========================================================= */

  const loadRequests = async () => {
    try {
      const authToken = getToken();

      if (!authToken) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/partner/profile-requests`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const pending =
        Array.isArray(data.requests)
          ? data.requests.find(
              (request) =>
                request.status === "PENDING"
            )
          : null;

      setPendingRequest(
        pending || null
      );
    } catch (error) {
      console.error(
        "LOAD PROFILE REQUESTS ERROR:",
        error
      );
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadProfile();
    loadRequests();
  }, []);

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage({
      type: "",
      text: "",
    });
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
      setMessage({
        type: "error",
        text:
          "Please select a valid image file.",
      });

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text:
          "Profile photo must be smaller than 5MB.",
      });

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((previous) => ({
        ...previous,
        profile_photo:
          reader.result,
      }));

      setMessage({
        type: "",
        text: "",
      });
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text:
          "Failed to read the selected photo.",
      });
    };

    reader.readAsDataURL(file);
  };

  /* =========================================================
     REMOVE PROFILE PHOTO
  ========================================================= */

  const handleRemovePhoto = () => {
    setProfile((previous) => ({
      ...previous,
      profile_photo: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setMessage({
      type: "",
      text: "",
    });
  };

  /* =========================================================
     SUBMIT PROFILE CHANGES
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!profile.name.trim()) {
      setMessage({
        type: "error",
        text: "Name is required.",
      });

      return;
    }

    if (!profile.company_name.trim()) {
      setMessage({
        type: "error",
        text:
          "Company name is required.",
      });

      return;
    }

    if (
      password &&
      password.length < 6
    ) {
      setMessage({
        type: "error",
        text:
          "New password must contain at least 6 characters.",
      });

      return;
    }

    if (pendingRequest) {
      setMessage({
        type: "error",
        text:
          "You already have a profile change request waiting for admin approval.",
      });

      return;
    }

    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    const authToken = getToken();

    if (!authToken) {
      setMessage({
        type: "error",
        text:
          "Your login session has expired. Please login again.",
      });

      return;
    }

    try {
      setSaving(true);

const response = await fetch(
  `${API_BASE}/api/partner/profile-request`,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },

    body: JSON.stringify({
      name: profile.name.trim(),
      company_name: profile.company_name.trim(),
      phone: profile.phone.trim(),
      profile_photo: profile.profile_photo || null,
      password: password || "",
    }),
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data.message ||
      "Failed to submit profile changes."
  );
}


      setMessage({
        type: "success",
        text:
          "Your profile changes were submitted to the admin for approval.",
      });

      setPassword("");

      setPendingRequest(
        data.request || null
      );
    } catch (error) {
      console.error(
        "SUBMIT PROFILE REQUEST ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to submit profile changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     PROFILE INITIAL
  ========================================================= */

  const profileInitial =
    (
      profile.name ||
      profile.company_name ||
      "P"
    )
      .charAt(0)
      .toUpperCase();

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading && !profile.name && !profile.email) {
    return (
      <div className="partner-settings-page">
        <div className="settings-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="partner-settings-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">
            SETTINGS
          </span>

          <h1>
            Profile Settings
          </h1>

          <p>
            Manage your workspace profile
            information.
          </p>
        </div>
      </div>

      {/* =====================================================
          PENDING REQUEST
      ===================================================== */}

      {pendingRequest && (
        <div className="pending-request">

          <div className="pending-icon">
            ⏳
          </div>

          <div>
            <strong>
              Profile changes awaiting
              approval
            </strong>

            <span>
              Your submitted changes are
              waiting for admin approval.
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          PROFILE CARD
      ===================================================== */}

      <form
        className="settings-card"
        onSubmit={handleSubmit}
      >

        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div className="settings-card-header">

          <div>
            <h2>
              Profile Information
            </h2>

            <p>
              Update your personal and
              company information.
            </p>
          </div>

        </div>

        {/* ===================================================
            PROFILE PHOTO
        =================================================== */}

        <div className="profile-photo-section">

          <div className="profile-photo">

            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt="Profile"
              />
            ) : (
              <span>
                {profileInitial}
              </span>
            )}

          </div>

          <div className="photo-details">

            <strong>
              Profile Photo
            </strong>

            <p>
              JPG, PNG or WEBP.
              Maximum size 5MB.
            </p>

            <div className="photo-actions">

              <button
                type="button"
                className="photo-upload-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  saving ||
                  Boolean(pendingRequest)
                }
              >
                Upload Photo
              </button>

              {profile.profile_photo && (
                <button
                  type="button"
                  className="photo-remove-button"
                  onClick={handleRemovePhoto}
                  disabled={
                    saving ||
                    Boolean(pendingRequest)
                  }
                >
                  Remove
                </button>
              )}

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handlePhotoChange}
            />

          </div>
        </div>

        {/* ===================================================
            DETAILS
        =================================================== */}

        <div className="settings-form-grid">

          {/* NAME */}

          <div className="settings-field">

            <label htmlFor="profile-name">
              Full Name
            </label>

            <input
              id="profile-name"
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={
                saving ||
                Boolean(pendingRequest)
              }
            />

          </div>

          {/* EMAIL */}

          <div className="settings-field">

            <label htmlFor="profile-email">
              Email Address
            </label>

            <div className="locked-input">

              <input
                id="profile-email"
                type="email"
                value={profile.email}
                disabled
                readOnly
              />

              <span>
                🔒
              </span>

            </div>

            <small>
              Email address cannot be changed.
            </small>

          </div>

          {/* COMPANY */}

          <div className="settings-field">

            <label htmlFor="profile-company">
              Company Name
            </label>

            <input
              id="profile-company"
              type="text"
              name="company_name"
              value={profile.company_name}
              onChange={handleChange}
              placeholder="Enter company name"
              disabled={
                saving ||
                Boolean(pendingRequest)
              }
            />

          </div>

          {/* PHONE */}

          <div className="settings-field">

            <label htmlFor="profile-phone">
              Phone Number
            </label>

            <input
              id="profile-phone"
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={
                saving ||
                Boolean(pendingRequest)
              }
            />

          </div>

        </div>

        {/* ===================================================
            PASSWORD
        =================================================== */}

        <div className="password-section">

          <div className="password-section-header">

            <h2>
              Change Password
            </h2>

            <p>
              Leave blank if you don't
              want to change your password.
            </p>

          </div>

          <div className="settings-field">

            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter new password"
              disabled={
                saving ||
                Boolean(pendingRequest)
              }
            />

            <small>
              Minimum 6 characters.
              Password changes also
              require admin approval.
            </small>

          </div>

        </div>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message.text && (
          <div
            className={`settings-message ${message.type}`}
          >
            <span>
              {message.type ===
              "success"
                ? "✓"
                : "!"}
            </span>

            {message.text}
          </div>
        )}

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="settings-actions">

          <button
            type="submit"
            className="save-settings-button"
            disabled={
              saving ||
              Boolean(pendingRequest)
            }
          >
            {saving
              ? "Submitting..."
              : pendingRequest
              ? "Awaiting Approval"
              : "Submit Changes"}
          </button>

        </div>

      </form>
    </div>
  );
}

export default PartnerSettings;