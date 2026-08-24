import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./ui/LoadingSpinner";

export default function ProtectedRoute({ children, role, roles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const token = user?.token;
  const userRole = user?.role === "sales_executive" ? "sales" : user?.role;

  if (loading) return <LoadingSpinner text="Authenticating..." />;

  if (!token || !isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Single role check
  if (role && userRole !== role) return <Navigate to="/" replace />;

  // Multiple roles check
  if (roles && !roles.includes(userRole)) return <Navigate to="/" replace />;

  return children;
}

