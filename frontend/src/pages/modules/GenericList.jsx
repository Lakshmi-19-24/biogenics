import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";

const humanize = (s) =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const asText = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toLocaleString();
  if (Array.isArray(v)) return v.length ? `${v.length} items` : "—";
  if (typeof v === "object") {
    if (v.name) return String(v.name);
    if (v._id) return String(v._id).slice(-6);
    return "Object";
  }
  return String(v);
};

export default function GenericList({
  title,
  eyebrow,
  subtitle,
  endpoint,
  columns,
  roles,
  emptyMessage = "No records found.",
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const cols = useMemo(() => {
    if (Array.isArray(columns) && columns.length) return columns;
    // Fallback if no columns are provided: try to show some common fields
    const keys = ["name", "title", "status", "amount", "createdAt", "_id"];
    return keys.map((k) => ({
      header: humanize(k),
      accessor: k,
      render: (r) => <span style={{ fontWeight: k === "name" || k === "title" ? 700 : 500 }}>{asText(r?.[k])}</span>,
    }));
  }, [columns]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(endpoint);
      const items = apiItems(res);
      setRows(items);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  if (loading) return <LoadingSpinner text={`Loading ${title || "data"}...`} />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={
          <button onClick={load} className="btn-primary" style={{ padding: "10px 14px", fontSize: "13px" }}>
            Refresh
          </button>
        }
      />
      <DataTable columns={cols} data={rows} pageSize={15} emptyMessage={emptyMessage} />
      {roles ? null : null}
    </div>
  );
}

