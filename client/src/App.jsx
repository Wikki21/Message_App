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
import Payment from "./pages/Payment";


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
<Route
  path="/payment"
  element={
    <Payment />
  }
/>

        {/* =================================================
            PUBLIC PARTNER CREATE ACCOUNT
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
            PARTNER APPLICATION
        ================================================= */}

        <Route
          element={
            <PartnerLayout />
          }
        >

          {/* -----------------------------------------------
              DASHBOARD
          ----------------------------------------------- */}

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />


          {/* -----------------------------------------------
              CUSTOMERS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/customers"
            element={
              <Customers />
            }
          />


          {/* -----------------------------------------------
              CAMPAIGNS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/campaigns"
            element={
              <Campaigns />
            }
          />


          {/* -----------------------------------------------
              REPORTS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/reports"
            element={
              <Reports />
            }
          />


          {/* -----------------------------------------------
              TEMPLATES
          ----------------------------------------------- */}

          <Route
            path="/dashboard/templates"
            element={
              <Templates />
            }
          />


          {/* -----------------------------------------------
              SETTINGS
          ----------------------------------------------- */}

          <Route
            path="/dashboard/settings"
            element={
              <PartnerSettings />
            }
          />


          {/* -----------------------------------------------
              WHATSAPP
          ----------------------------------------------- */}

          <Route
            path="/campaigns/whatsapp"
            element={
              <WhatsAppCampaign />
            }
          />


          {/* -----------------------------------------------
              SMS
          ----------------------------------------------- */}

          <Route
            path="/campaigns/sms"
            element={
              <SmsCampaign />
            }
          />


          {/* -----------------------------------------------
              MAIL
          ----------------------------------------------- */}

          <Route
            path="/campaigns/mail"
            element={
              <MailCampaign />
            }
          />


          {/* -----------------------------------------------
              COMPATIBILITY ROUTES
          ----------------------------------------------- */}

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
            ADMIN APPLICATION
        ================================================= */}

        <Route
          element={
            <AdminLayout />
          }
        >

          {/* -----------------------------------------------
              ADMIN DASHBOARD
          ----------------------------------------------- */}

          <Route
            path="/admin/dashboard"
            element={
              <Dashboard />
            }
          />


          {/* -----------------------------------------------
              PARTNER APPLICATIONS
          ----------------------------------------------- */}

          <Route
            path="/admin/partner-applications"
            element={
              <AdminPartnerApplications />
            }
          />


          {/* -----------------------------------------------
              PROFILE CHANGE REQUESTS
          ----------------------------------------------- */}

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
