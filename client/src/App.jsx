import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Clients from "./pages/Clients";
import CreateInvoice from "./pages/CreateInvoice";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import PayInvoice from "./pages/PayInvoice";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import PaymentSuccess from "./pages/PaymentSuccess";

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Sidebar />
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 pb-24 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8 lg:pt-24">
        {children}
      </main>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pay/:invoice_number" element={<PayInvoice />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedLayout>
            <Clients />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedLayout>
            <Invoices />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices/create"
        element={
          <ProtectedLayout>
            <CreateInvoice />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
