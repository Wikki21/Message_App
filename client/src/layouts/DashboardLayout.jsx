import React, { useState } from "react";
import {
  NavLink,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./DashboardLayout.css";


function DashboardLayout() {
  const {
    user,
    role,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] =
    useState(false);


  /* =======================================================
     ROLE
  ======================================================= */

  const isAdmin =
    role === "ADMIN";

  const isPartner =
    role === "PARTNER";


  /* =======================================================
     WORKSPACE / ACCOUNT NAME
  ======================================================= */

  const workspaceAccountName = isAdmin
    ? "Zaploft"
    : user?.company_name ||
      user?.workspace_name ||
      user?.workspace ||
      user?.companyName ||
      user?.business_name ||
      user?.businessName ||
      user?.name ||
      "Partner Workspace";


  /* =======================================================
     PARTNER NAME
  ======================================================= */

  const partnerName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "";


  /* =======================================================
     PARTNER NAVIGATION
  ======================================================= */

  const partnerNavigation = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: "grid",
    },

    {
      to: "/dashboard/campaigns",
      label: "Campaigns",
      icon: "send",
      arrow: true,
    },

    {
      to: "/dashboard/customers",
      label: "Customers",
      icon: "users",
    },

    {
      to: "/dashboard/templates",
      label: "Templates",
      icon: "template",
    },

    {
      to: "/dashboard/reports",
      label: "Reports",
      icon: "chart",
    },

    {
      to: "/dashboard/settings",
      label: "Settings",
      icon: "settings",
    },
  ];


  /* =======================================================
     ADMIN NAVIGATION
     
     IMPORTANT:
     Partner Creation has been removed.

     Admin now sees:
       Dashboard
       Partner Applications
       Profile Requests
       Customers
       Reports
  ======================================================= */

  const adminNavigation = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: "grid",
    },

    {
      to: "/admin/partner-applications",
      label: "Partner Applications",
      icon: "users",
    },

    {
      to: "/admin/profile-requests",
      label: "Profile Requests",
      icon: "users",
    },

    {
      to: "/admin/customers",
      label: "Customers",
      icon: "users",
    },

    {
      to: "/admin/reports",
      label: "Reports",
      icon: "chart",
    },
  ];


  /* =======================================================
     ACTIVE NAVIGATION
  ======================================================= */

  const navigation = isAdmin
    ? adminNavigation
    : isPartner
      ? partnerNavigation
      : [];


  /* =======================================================
     ICONS
  ======================================================= */

  const getIcon = (type) => {

    if (type === "grid") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="14"
            y="4"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="4"
            y="14"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="14"
            y="14"
            width="6"
            height="6"
            rx="1"
          />
        </svg>
      );
    }


    if (type === "send") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 3 10.7 13.3" />

          <path d="m21 3-6.5 18-3.8-7.7L3 9.5 21 3Z" />
        </svg>
      );
    }


    if (type === "users") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="9"
            cy="8"
            r="3"
          />

          <path d="M3.5 20c.6-3.4 2.4-5 5.5-5s4.9 1.6 5.5 5" />

          <path d="M16 5.5a3 3 0 0 1 0 5.8" />

          <path d="M17 15c2.1.4 3.3 2 3.8 4.5" />
        </svg>
      );
    }


    if (type === "template") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="5"
            y="3.5"
            width="14"
            height="17"
            rx="2"
          />

          <path d="M8.5 8h7" />

          <path d="M8.5 12h7" />

          <path d="M8.5 16h4" />
        </svg>
      );
    }


    if (type === "settings") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="3"
          />

          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.7-1.7.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L10 5.9l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V13h-.2a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    }


    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 19V9" />

        <path d="M10 19V5" />

        <path d="M16 19v-8" />

        <path d="M22 19V3" />
      </svg>
    );
  };


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    closeMobileMenu();

    logout();

    window.location.href =
      "/login";
  };


  return (
    <div className="dashboard-shell">


      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      {mobileOpen && (
        <button
          className="mobile-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
        />
      )}


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`dashboard-sidebar ${
          mobileOpen
            ? "dashboard-sidebar-open"
            : ""
        }`}
      >


        {/* =================================================
            BRAND
        ================================================= */}

        <div className="sidebar-brand">

          <div className="sidebar-brand-mark">
            Z
          </div>


          <div className="sidebar-brand-copy">

            <strong>
              Zaploft
            </strong>

            <span>
              MESSAGE AUTOMATION
            </span>

          </div>


          <button
            className="mobile-close"
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            ×
          </button>

        </div>


        {/* =================================================
            WORKSPACE TITLE
        ================================================= */}

        <div className="sidebar-workspace">

          <span>
            {isAdmin
              ? "ADMIN WORKSPACE"
              : "PARTNER WORKSPACE"}
          </span>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sidebar-navigation">

          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={
                item.to === "/dashboard" ||
                item.to === "/admin/dashboard"
              }
              onClick={
                closeMobileMenu
              }
              className={({ isActive }) =>
                `sidebar-nav-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span className="sidebar-nav-icon">
                {getIcon(item.icon)}
              </span>


              <span className="sidebar-nav-label">
                {item.label}
              </span>


              {item.arrow && (
                <span className="sidebar-nav-arrow">
                  ›
                </span>
              )}

            </NavLink>
          ))}

        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">


          {/* =================================================
              ACCOUNT / CONNECTION
          ================================================= */}

          <div className="meta-status">

            <span className="meta-status-icon">
              <span />
            </span>


            <div className="meta-status-copy">

              <strong
                title={
                  workspaceAccountName
                }
              >
                {workspaceAccountName}
              </strong>


              <small>
                {isAdmin
                  ? "Admin account"
                  : "Partner account"}
              </small>

            </div>


            <span className="meta-check">
              ✓
            </span>

          </div>


          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >

            <span className="logout-icon">

              <svg viewBox="0 0 24 24">

                <path d="M10 17l5-5-5-5" />

                <path d="M15 12H3" />

                <path d="M14 4h5v16h-5" />

              </svg>

            </span>


            <span>
              Logout
            </span>

          </button>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="sidebar-footer">

            <span>
              Zaploft
            </span>

            <span>
              v1.0
            </span>

          </div>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="dashboard-content">


        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          className="mobile-menu-trigger"
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open navigation"
        >

          <span />
          <span />
          <span />

        </button>


        {/* =================================================
            PAGE
        ================================================= */}

        <Outlet />

      </main>

    </div>
  );
}


export default DashboardLayout;