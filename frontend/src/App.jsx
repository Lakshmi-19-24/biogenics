import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import SalesDashboard from "./pages/SalesDashboard";

import Leads from "./pages/leads/Leads";
import LeadDetail from "./pages/leads/LeadDetail";
import Orders from "./pages/orders/Orders";
import OrderDetail from "./pages/orders/OrderDetail";
import Products from "./pages/products/Products";
import DailyActivity from "./pages/activity/DailyActivity";
import Attendance from "./pages/attendance/Attendance";
import Payments from "./pages/payments/Payments";
import GPSTracking from "./pages/tracking/GPSTracking";
import Notifications from "./pages/notifications/Notifications";
import Customers from "./pages/customers/Customers";
import Documents from "./pages/documents/Documents";
import Quotations from "./pages/billing/Quotations";
import Invoices from "./pages/billing/Invoices";
import Inventory from "./pages/inventory/Inventory";
import DailyReports from "./pages/reports/DailyReports";
import DailyReportSubmit from "./pages/reports/DailyReportSubmit";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/Settings";
import GenericList from "./pages/modules/GenericList";
import SearchResults from "./pages/SearchResults";
import Targets from "./pages/targets/Targets";
import Reminders from "./pages/reminders/Reminders";
import StatusBadge from "./components/ui/StatusBadge";

const attendanceAccessLabel = (row) => (row.isAttendanceActive ? "Active" : "Inactive");
const attendanceStatusLabel = (row) => {
  const status = String(row.attendanceStatus || "absent").replace(/_/g, " ");
  return status.replace(/\b\w/g, (letter) => letter.toUpperCase()).replace("Half Day", "Half-day");
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/register"
        element={
          <ProtectedRoute roles={["owner", "admin"]}>
            <Register />
          </ProtectedRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute roles={["owner", "admin", "manager", "sales"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Role-specific dashboards */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute role="sales">
              <SalesDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared module routes — accessible by all authenticated users */}
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/activity" element={<DailyActivity />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/tracking" element={<GPSTracking />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/daily-reports" element={<DailyReports />} />
        <Route path="/daily-reports/submit" element={<ProtectedRoute role="sales"><DailyReportSubmit /></ProtectedRoute>} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/inventory" element={<ProtectedRoute roles={["owner","admin","manager"]}><Inventory /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["owner","admin","manager"]}><GenericList eyebrow="Admin" title="Users & Roles" subtitle="User access directory" endpoint="/users" columns={[
          { header: "Name", accessor: "name", render: (row) => row.name || "-" },
          { header: "Email", accessor: "email", render: (row) => row.email || "-" },
          { header: "Role", accessor: "role", render: (row) => row.role || "-" },
          { header: "Branch", accessor: "branch", render: (row) => row.branch || "-" },
          { header: "Territory", accessor: "territory", render: (row) => row.territory || "-" },
          { header: "Today", accessor: "attendanceStatus", render: (row) => <StatusBadge status={attendanceStatusLabel(row)} /> },
          { header: "Status", accessor: "isAttendanceActive", render: (row) => <StatusBadge status={attendanceAccessLabel(row)} /> },
        ]} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={["owner","admin","manager"]}><Reports /></ProtectedRoute>} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["owner", "admin", "manager"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
