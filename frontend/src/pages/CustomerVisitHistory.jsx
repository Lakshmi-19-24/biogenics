
import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import API, { apiErrorMessage, apiItems } from "../services/api";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLocation = (location) => {
  const coordinates = location?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    coordinates.some((value) => !Number.isFinite(Number(value))) ||
    (Number(coordinates[0]) === 0 && Number(coordinates[1]) === 0)
  ) {
    return "-";
  }

  const [longitude, latitude] = coordinates;

  return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
};

const titleCase = (value = "") =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CustomerVisitHistory() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVisits = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/visits?limit=200");
      setVisits(apiItems(response));
    } catch (err) {
      console.error("Failed to load customer visits:", err);

      const message = apiErrorMessage(
        err,
        "Failed to load customer visit history"
      );

      setError(message);
      setVisits([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const columns = [
    {
      header: "Customer",
      accessor: "customer",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>
            {row.customer?.name || "Unknown customer"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {row.customer?.phone || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Salesperson",
      accessor: "employee",
      render: (row) => row.employee?.name || "-",
    },
    {
      header: "Purpose",
      accessor: "purpose",
      render: (row) => titleCase(row.purpose || "sales"),
    },
    {
      header: "Check-in",
      accessor: "checkInAt",
      render: (row) => formatDateTime(row.checkInAt),
    },
    {
      header: "Check-out",
      accessor: "checkOutAt",
      render: (row) => formatDateTime(row.checkOutAt),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => titleCase(row.status || "planned"),
    },
    {
      header: "Check-in GPS",
      accessor: "location",
      render: (row) => formatLocation(row.location),
    },
    {
      header: "Check-out GPS",
      accessor: "checkOutLocation",
      render: (row) => formatLocation(row.checkOutLocation),
    },
    {
      header: "Notes / Feedback",
      accessor: "notes",
      render: (row) => (
        <div style={{ minWidth: 160, maxWidth: 260 }}>
          {row.notes || row.feedback || "-"}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Sales Operations"
        title="Customer Visit History"
        subtitle="Review salesperson customer visits, check-in and check-out times, and saved GPS locations."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={loadVisits}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={visits}
        loading={loading}
        error={error}
        pageSize={15}
        emptyMessage="No customer visits found."
      />
    </div>
  );
}
