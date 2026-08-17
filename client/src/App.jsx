import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout
  from "./layouts/DashboardLayout";

import Login
  from "./pages/Login";

import Dashboard
  from "./pages/Dashboard";

import Customers
  from "./pages/Customers";

import Campaigns
  from "./pages/Campaigns";

import Reports
  from "./pages/Reports";

import Templates
  from "./pages/Templates";

import WhatsAppCampaign
  from "./pages/WhatsAppCampaign";

import SmsCampaign
  from "./pages/SmsCampaign";

import MailCampaign
  from "./pages/MailCampaign";

import PartnerSettings
  from "./pages/PartnerSettings";

import PartnerCreateAccount
  from "./pages/PartnerCreateAccount";

import AdminPartnerApplications
  from "./pages/AdminPartnerApplications";

import AdminProfileRequests
  from "./pages/AdminProfileRequests";

import ProtectedRoute
  from "./components/ProtectedRoute";

import {
  useAuth,
} from "./context/AuthContext";


/* =========================================================
   PARTNER LAYOUT
========================================================= */

function PartnerLayout() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "PARTNER",
      ]}
    >
      <DashboardLayout />
    </ProtectedRoute>
  );
}


/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "ADMIN",
      ]}
    >
      <DashboardLayout />
    </ProtectedRoute>
  );
}


/* =========================================================
   ROOT REDIRECT
========================================================= */

function RootRedirect() {
  const {
    isAuthenticated,
    role,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (role === "ADMIN") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  if (role === "PARTNER") {
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


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            PUBLIC LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* =================================================
            PUBLIC PARTNER CREATE ACCOUNT

            DIRECT ACCESS:
            /create-account?plan=solo
            /create-account?plan=pro
            /create-account?plan=business
        ================================================= */}

        <Route
          path="/create-account"
          element={
            <PartnerCreateAccount />
          }
        />


        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />


        {/* =================================================
            PARTNER DASHBOARD
        ================================================= */}

        <Route
          element={
            <PartnerLayout />
          }
        >

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/dashboard/customers"
            element={
              <Customers />
            }
          />

          <Route
            path="/dashboard/campaigns"
            element={
              <Campaigns />
            }
          />

          <Route
            path="/dashboard/reports"
            element={
              <Reports />
            }
          />

          <Route
            path="/dashboard/templates"
            element={
              <Templates />
            }
          />

          <Route
            path="/dashboard/settings"
            element={
              <PartnerSettings />
            }
          />

          <Route
            path="/campaigns/whatsapp"
            element={
              <WhatsAppCampaign />
            }
          />

          <Route
            path="/campaigns/sms"
            element={
              <SmsCampaign />
            }
          />

          <Route
            path="/campaigns/mail"
            element={
              <MailCampaign />
            }
          />

          <Route
            path="/dashboard/whatsapp"
            element={
              <WhatsAppCampaign />
            }
          />

          <Route
            path="/dashboard/sms"
            element={
              <SmsCampaign />
            }
          />

          <Route
            path="/dashboard/mail"
            element={
              <MailCampaign />
            }
          />

        </Route>


        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          element={
            <AdminLayout />
          }
        >

          <Route
            path="/admin/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/admin/partner-applications"
            element={
              <AdminPartnerApplications />
            }
          />

          <Route
            path="/admin/profile-requests"
            element={
              <AdminProfileRequests />
            }
          />

        </Route>


        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={
            <RootRedirect />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;
