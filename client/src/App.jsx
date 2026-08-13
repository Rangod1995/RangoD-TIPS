import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Predictions from "./pages/Predictions";
import PredictionDetails from "./pages/PredictionDetails";
import LiveMatchesPage from "./pages/LiveMatchesPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import PricingPage from "./pages/PricingPage";
import PremiumPage from "./pages/PremiumPage";
import AccountPage from "./pages/AccountPage";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

import Dashboard from "./pages/dashboard/DashboardPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPredictions from "./pages/AdminPredictions";
import EditPrediction from "./pages/admin/EditPrediction";
import CreatePrediction from "./pages/admin/CreatePrediction";

import { DashboardProvider } from "./context/DashboardContext";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<Layout />}>

          <Route index element={<Home />} />

          <Route
            path="/predictions"
            element={<Predictions />}
          />

          <Route
            path="/predictions/:id"
            element={<PredictionDetails />}
          />

          <Route
            path="/live"
            element={<LiveMatchesPage />}
          />

          <Route
            path="/competitions"
            element={<CompetitionsPage />}
          />

          <Route
            path="/pricing"
            element={<PricingPage />}
          />


          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardProvider>
                  <Dashboard />
                </DashboardProvider>
              </ProtectedRoute>
            }
          />


          <Route
            path="/premium"
            element={
              <ProtectedRoute>
                <PremiumPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment-success" element={<PaymentSuccess />} />


          {/* ADMIN ROUTES */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/predictions"
            element={
              <ProtectedRoute adminOnly>
                <AdminPredictions />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/predictions/edit/:id"
            element={
              <ProtectedRoute adminOnly>
                <EditPrediction />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/create-prediction"
            element={
              <ProtectedRoute adminOnly>
                <CreatePrediction />
              </ProtectedRoute>
            }
          />


        </Route>


        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />

        <Route
    path="/forgot-password"
    element={<ForgotPassword />}
/>


        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
