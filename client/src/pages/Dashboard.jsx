import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

function Dashboard() {
  const { user, role } = useAuth();

  const [showPartnerForm, setShowPartnerForm] = useState(false);

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    phone: "",
  });

  const [creatingPartner, setCreatingPartner] = useState(false);

  const [partnerMessage, setPartnerMessage] = useState({
    type: "",
    text: "",
  });

  /* =========================================================
     USER / WORKSPACE INFORMATION
  ========================================================= */

  const isAdmin = role === "ADMIN";
  const isPartner = role === "PARTNER";

  /*
   * IMPORTANT:
   * This is the name shown in:
   *
   * 1. Header right-side workspace button
   * 2. Sidebar connection/workspace card
   *
   * For PARTNER, we use COMPANY / WORKSPACE name.
   * We intentionally do NOT use user.name here.
   */

  const workspaceAccountName = isAdmin
    ? "Zaploft"
    : 
      user?.name ||
      user?.company_name ||
      user?.workspace ||
      user?.companyName ||
      user?.business_name ||
      user?.businessName ||
      "Partner Workspace";

  /*
   * Partner person's name.
   * Used only for profile/avatar or personal information.
   */

  const partnerName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "";

  /* =========================================================
     PARTNER FORM
  ========================================================= */

  const handlePartnerChange = (event) => {
    const { name, value } = event.target;

    setPartnerForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     CREATE PARTNER
  ========================================================= */

  const handleCreatePartner = async (event) => {
    event.preventDefault();

    setPartnerMessage({
      type: "",
      text: "",
    });

    if (!partnerForm.name.trim()) {
      setPartnerMessage({
        type: "error",
        text: "Partner name is required.",
      });
      return;
    }

    if (!partnerForm.email.trim()) {
      setPartnerMessage({
        type: "error",
        text: "Partner email is required.",
      });
      return;
    }

    if (!partnerForm.password) {
      setPartnerMessage({
        type: "error",
        text: "Partner password is required.",
      });
      return;
    }

    if (partnerForm.password.length < 6) {
      setPartnerMessage({
        type: "error",
        text: "Password must contain at least 6 characters.",
      });
      return;
    }

    if (!partnerForm.company_name.trim()) {
      setPartnerMessage({
        type: "error",
        text: "Company name is required.",
      });
      return;
    }

    try {
      setCreatingPartner(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/api/admin/partners`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            name: partnerForm.name.trim(),

            email: partnerForm.email
              .trim()
              .toLowerCase(),

            password: partnerForm.password,

            company_name:
              partnerForm.company_name.trim(),

            phone:
              partnerForm.phone.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create partner."
        );
      }

      setPartnerMessage({
        type: "success",
        text:
          "Partner created successfully. They can now login using this email and password.",
      });

      setPartnerForm({
        name: "",
        email: "",
        password: "",
        company_name: "",
        phone: "",
      });
    } catch (error) {
      console.error(
        "CREATE PARTNER ERROR:",
        error
      );

      setPartnerMessage({
        type: "error",
        text:
          error.message ||
          "Failed to create partner.",
      });
    } finally {
      setCreatingPartner(false);
    }
  };

  return (
    <div className="dashboard-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="dashboard-header">

        <div>
          <div className="dashboard-eyebrow">
            {isAdmin
              ? "ADMIN OVERVIEW"
              : "WORKSPACE OVERVIEW"}
          </div>

          <h1>
            Good afternoon 👋
          </h1>

          <p>
            {isAdmin
              ? "Here's what's happening across your Zaploft platform."
              : `Here's what's happening with ${
                  workspaceAccountName ||
                  "your"
                } messaging campaigns.`}
          </p>
        </div>

        {/* ===================================================
            HEADER RIGHT
        =================================================== */}

        <div className="dashboard-header-actions">

          {/* WORKSPACE NAME */}

          <button
            type="button"
            className="partner-button"
            title={workspaceAccountName}
          >
            <span className="online-dot" />

            <span className="partner-button-text">
              {workspaceAccountName}
            </span>
          </button>

          {/* PROFILE */}

          <div
            className="dashboard-profile"
            title={
              isAdmin
                ? "Admin"
                : partnerName ||
                  workspaceAccountName
            }
          >
            {isAdmin
              ? "A"
              : (
                  partnerName ||
                  workspaceAccountName ||
                  "P"
                )
                  .charAt(0)
                  .toUpperCase()}
          </div>

        </div>

      </header>


      {/* =====================================================
          ADMIN — CREATE PARTNER
      ===================================================== */}

      {isAdmin && (
        <section className="admin-partner-section">

          <div className="admin-partner-header">

            <div>

              <div className="dashboard-eyebrow">
                ADMINISTRATION
              </div>

              <h2>
                Partner Management
              </h2>

              <p>
                Create a partner account and give
                them access to the Partner Dashboard.
              </p>

            </div>

            <button
              type="button"
              className="create-partner-button"
              onClick={() =>
                setShowPartnerForm(
                  (previous) => !previous
                )
              }
            >

              <span>
                {showPartnerForm
                  ? "×"
                  : "+"}
              </span>

              {showPartnerForm
                ? "Close"
                : "Create Partner"}

            </button>

          </div>


          {/* =================================================
              PARTNER FORM
          ================================================= */}

          {showPartnerForm && (
            <form
              className="partner-create-form"
              onSubmit={handleCreatePartner}
            >

              <div className="partner-form-grid">

                {/* NAME */}

                <div className="partner-form-field">

                  <label htmlFor="partner-name">
                    Partner Name
                  </label>

                  <input
                    id="partner-name"
                    name="name"
                    type="text"
                    placeholder="Enter partner name"
                    value={partnerForm.name}
                    onChange={
                      handlePartnerChange
                    }
                  />

                </div>


                {/* EMAIL */}

                <div className="partner-form-field">

                  <label htmlFor="partner-email">
                    Email Address
                  </label>

                  <input
                    id="partner-email"
                    name="email"
                    type="email"
                    placeholder="partner@example.com"
                    value={partnerForm.email}
                    onChange={
                      handlePartnerChange
                    }
                  />

                </div>


                {/* PASSWORD */}

                <div className="partner-form-field">

                  <label htmlFor="partner-password">
                    Password
                  </label>

                  <input
                    id="partner-password"
                    name="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={partnerForm.password}
                    onChange={
                      handlePartnerChange
                    }
                  />

                </div>


                {/* COMPANY */}

                <div className="partner-form-field">

                  <label htmlFor="partner-company">
                    Company Name
                  </label>

                  <input
                    id="partner-company"
                    name="company_name"
                    type="text"
                    placeholder="Enter company name"
                    value={
                      partnerForm.company_name
                    }
                    onChange={
                      handlePartnerChange
                    }
                  />

                </div>


                {/* PHONE */}

                <div className="partner-form-field">

                  <label htmlFor="partner-phone">
                    Phone
                    <span>
                      Optional
                    </span>
                  </label>

                  <input
                    id="partner-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={partnerForm.phone}
                    onChange={
                      handlePartnerChange
                    }
                  />

                </div>

              </div>


              {/* MESSAGE */}

              {partnerMessage.text && (
                <div
                  className={`partner-form-message ${partnerMessage.type}`}
                >

                  {partnerMessage.type ===
                    "success" && (
                    <span>✓</span>
                  )}

                  {partnerMessage.type ===
                    "error" && (
                    <span>!</span>
                  )}

                  {partnerMessage.text}

                </div>
              )}


              {/* ACTIONS */}

              <div className="partner-form-actions">

                <button
                  type="button"
                  className="partner-cancel-button"
                  onClick={() => {
                    setShowPartnerForm(false);

                    setPartnerMessage({
                      type: "",
                      text: "",
                    });
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="partner-save-button"
                  disabled={creatingPartner}
                >
                  {creatingPartner
                    ? "Creating..."
                    : "Create Partner Account"}
                </button>

              </div>

            </form>
          )}

        </section>
      )}


      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="dashboard-stats">

        <StatCard
          icon="users"
          label="Total Customers"
          value="248"
          change="+12.4%"
          positive
        />

        <StatCard
          icon="campaign"
          label="Active Campaigns"
          value="12"
          change="+3 this month"
          positive
        />

        <StatCard
          icon="message"
          label="Messages Sent"
          value="1,842"
          change="+18.2%"
          positive
        />

        <StatCard
          icon="failed"
          label="Failed Messages"
          value="8"
          change="-2.1%"
          positive
        />

      </section>


      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <section className="dashboard-main-grid">

        {/* PERFORMANCE */}

        <div className="dashboard-card performance-card">

          <div className="card-heading">

            <div>

              <h2>
                Message Performance
              </h2>

              <p>
                Messages sent over the last
                7 days.
              </p>

            </div>

            <select>

              <option>
                Last 7 days
              </option>

              <option>
                Last 30 days
              </option>

              <option>
                Last 90 days
              </option>

            </select>

          </div>


          <div className="performance-summary">

            <div>

              <strong>
                1,842
              </strong>

              <span>
                Total messages
              </span>

            </div>

            <div>

              <strong>
                96.8%
              </strong>

              <span>
                Delivery rate
              </span>

            </div>

            <div>

              <strong>
                3.2%
              </strong>

              <span>
                Failure rate
              </span>

            </div>

          </div>


          <div className="chart">

            <div className="chart-y-axis">

              <span>500</span>
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>

            </div>

            <div className="chart-area">

              <div className="chart-grid-line" />
              <div className="chart-grid-line" />
              <div className="chart-grid-line" />
              <div className="chart-grid-line" />
              <div className="chart-grid-line" />

              <svg
                className="chart-line"
                viewBox="0 0 700 240"
                preserveAspectRatio="none"
              >

                <defs>

                  <linearGradient
                    id="chartFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#7c3aed"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="100%"
                      stopColor="#7c3aed"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>

                <path
                  d="M0 180
                     C55 170 65 130 110 145
                     S175 155 220 110
                     S285 125 330 95
                     S395 110 440 70
                     S500 95 545 62
                     S615 78 700 35
                     L700 240
                     L0 240 Z"
                  fill="url(#chartFill)"
                />

                <path
                  d="M0 180
                     C55 170 65 130 110 145
                     S175 155 220 110
                     S285 125 330 95
                     S395 110 440 70
                     S500 95 545 62
                     S615 78 700 35"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

              </svg>


              <div className="chart-days">

                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>

              </div>

            </div>

          </div>

        </div>


        {/* QUICK ACTIONS */}

        <div className="dashboard-card quick-actions-card">

          <div className="card-heading">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Start something new.
              </p>

            </div>

          </div>


          <div className="quick-actions">

            <button className="quick-action whatsapp">

              <span className="quick-action-icon">
                ↗
              </span>

              <span>

                <strong>
                  WhatsApp Campaign
                </strong>

                <small>
                  Send messages to customers
                </small>

              </span>

              <b>→</b>

            </button>


            <button className="quick-action sms">

              <span className="quick-action-icon">
                ◇
              </span>

              <span>

                <strong>
                  SMS Campaign
                </strong>

                <small>
                  Create an SMS campaign
                </small>

              </span>

              <b>→</b>

            </button>


            <button className="quick-action email">

              <span className="quick-action-icon">
                @
              </span>

              <span>

                <strong>
                  Email Campaign
                </strong>

                <small>
                  Send an email campaign
                </small>

              </span>

              <b>→</b>

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM
      ===================================================== */}

      <section className="dashboard-bottom-grid">

        {/* RECENT CAMPAIGNS */}

        <div className="dashboard-card recent-card">

          <div className="card-heading">

            <div>

              <h2>
                Recent Campaigns
              </h2>

              <p>
                Your latest messaging activity.
              </p>

            </div>

            <button className="view-all">
              View all →
            </button>

          </div>


          <div className="campaign-table">

            <div className="campaign-table-header">

              <span>
                CAMPAIGN
              </span>

              <span>
                CHANNEL
              </span>

              <span>
                SENT
              </span>

              <span>
                STATUS
              </span>

            </div>


            <CampaignRow
              name="Monthly Offer"
              channel="WhatsApp"
              sent="420"
              status="Completed"
              type="success"
            />

            <CampaignRow
              name="Fee Reminder"
              channel="WhatsApp"
              sent="218"
              status="Running"
              type="running"
            />

            <CampaignRow
              name="Welcome Campaign"
              channel="SMS"
              sent="156"
              status="Completed"
              type="success"
            />

            <CampaignRow
              name="Festival Promotion"
              channel="WhatsApp"
              sent="96"
              status="Failed"
              type="failed"
            />

          </div>

        </div>


        {/* ACTIVITY */}

        <div className="dashboard-card activity-card">

          <div className="card-heading">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Latest updates.
              </p>

            </div>

          </div>


          <div className="activity-list">

            <Activity
              icon="✓"
              title="Monthly Offer completed"
              text="420 messages sent successfully"
              time="12 min ago"
              type="success"
            />

            <Activity
              icon="↗"
              title="Fee Reminder started"
              text="218 customers are being processed"
              time="35 min ago"
              type="purple"
            />

            <Activity
              icon="+"
              title="12 new customers added"
              text="Customer list was updated"
              time="1 hour ago"
              type="blue"
            />

            <Activity
              icon="!"
              title="4 messages failed"
              text="Check campaign delivery report"
              time="2 hours ago"
              type="red"
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="dashboard-footer">

        <span>
          © {new Date().getFullYear()} Zaploft
        </span>

        <span>
          Message Automation Platform
        </span>

      </footer>

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  change,
  positive,
}) {
  return (
    <div className="dashboard-stat-card">

      <div
        className={`stat-card-icon ${icon}`}
      >
        {icon === "users" && "♙"}
        {icon === "campaign" && "↗"}
        {icon === "message" && "✉"}
        {icon === "failed" && "!"}
      </div>

      <div className="stat-card-content">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small
          className={
            positive
              ? "positive"
              : ""
          }
        >
          {change}
        </small>

      </div>

    </div>
  );
}


/* =========================================================
   CAMPAIGN ROW
========================================================= */

function CampaignRow({
  name,
  channel,
  sent,
  status,
  type,
}) {
  return (
    <div className="campaign-table-row">

      <div className="campaign-name">

        <div className="campaign-avatar">
          {name.charAt(0)}
        </div>

        <strong>
          {name}
        </strong>

      </div>

      <span className="channel-badge">
        {channel}
      </span>

      <strong className="sent-count">
        {sent}
      </strong>

      <span
        className={`campaign-status ${type}`}
      >
        <i />
        {status}
      </span>

    </div>
  );
}


/* =========================================================
   ACTIVITY
========================================================= */

function Activity({
  icon,
  title,
  text,
  time,
  type,
}) {
  return (
    <div className="activity-item">

      <div
        className={`activity-icon ${type}`}
      >
        {icon}
      </div>

      <div className="activity-content">

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

        <small>
          {time}
        </small>

      </div>

    </div>
  );
}


export default Dashboard;
