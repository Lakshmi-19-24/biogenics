import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FileSpreadsheet, Plus, Trash2, Upload, UserPlus, Download } from "lucide-react";

const inputStyle = {
  width: "100%",
  fontFamily: "Be Vietnam Pro,sans-serif",
  fontSize: "14px",
  color: "var(--text)",
  background: "var(--surface-2)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "10px 14px",
  outline: "none",
};

const roleLabel = (role) =>
  role === "admin" ? "Billing" : role === "sales" ? "Sales" : role === "manager" ? "Manager" : role;

const idOf = (item) => item?._id || item?.id || item;

function RecipientPicker({ value, onChange, recipients }) {
  const toggle = (id) =>
    onChange({
      ...value,
      assignedTo: value.assignedTo.includes(id)
        ? value.assignedTo.filter((x) => x !== id)
        : [...value.assignedTo, id],
    });

  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={value.accessAll}
          onChange={(e) => onChange({ ...value, accessAll: e.target.checked })}
        />
        Give access to everyone (Sales + Billing)
      </label>

      {!value.accessAll && (
        <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "8px 12px" }}>
          {recipients.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No users available.</p>}
          {recipients.map((person) => (
            <label key={idOf(person)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", fontSize: "14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={value.assignedTo.includes(idOf(person))}
                onChange={() => toggle(idOf(person))}
              />
              <span style={{ fontWeight: 600 }}>{person.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>({roleLabel(person.role)})</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExcelSheets() {
  const { user } = useAuth();
  const canGrant = ["owner", "manager"].includes(user?.role);

  const [sheets, setSheets] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", notes: "", file: null, accessAll: false, assignedTo: [] });

  const [accessSheet, setAccessSheet] = useState(null);
  const [accessForm, setAccessForm] = useState({ accessAll: false, assignedTo: [] });
  const [savingAccess, setSavingAccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const requests = [API.get("/excel-sheets?limit=500")];
      if (canGrant) requests.push(API.get("/excel-sheets/recipients"));
      const [sheetsRes, recipientsRes] = await Promise.all(requests);
      setSheets(apiItems(sheetsRes));
      if (recipientsRes) setRecipients(apiItems(recipientsRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load Excel sheets"));
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const resetUpload = () => setForm({ title: "", notes: "", file: null, accessAll: false, assignedTo: [] });

  const submitUpload = async (event) => {
    event.preventDefault();
    if (!form.file) return toast.error("Please choose an Excel file");

    const body = new FormData();
    body.append("title", form.title || form.file.name);
    if (form.notes) body.append("notes", form.notes);
    body.append("file", form.file);
    if (canGrant) {
      body.append("accessAll", String(form.accessAll));
      body.append("assignedTo", JSON.stringify(form.accessAll ? [] : form.assignedTo));
    }

    setUploading(true);
    try {
      await API.post("/excel-sheets", body, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Excel sheet uploaded");
      setUploadOpen(false);
      resetUpload();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to upload Excel sheet"));
    } finally {
      setUploading(false);
    }
  };

  const openAccess = (sheet) => {
    setAccessSheet(sheet);
    setAccessForm({
      accessAll: Boolean(sheet.accessAll),
      assignedTo: (sheet.assignedTo || []).map(idOf),
    });
  };

  const saveAccess = async () => {
    setSavingAccess(true);
    try {
      await API.patch(`/excel-sheets/${idOf(accessSheet)}/access`, {
        accessAll: accessForm.accessAll,
        assignedTo: accessForm.accessAll ? [] : accessForm.assignedTo,
      });
      toast.success("Access updated");
      setAccessSheet(null);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update access"));
    } finally {
      setSavingAccess(false);
    }
  };

  const removeSheet = async (sheet) => {
    if (!window.confirm(`Delete "${sheet.title}"?`)) return;
    try {
      await API.delete(`/excel-sheets/${idOf(sheet)}`);
      toast.success("Excel sheet deleted");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete sheet"));
    }
  };

  const accessLabel = (row) => {
    if (row.accessAll) return "Everyone";
    if (row.assignedTo?.length) return row.assignedTo.map((u) => u.name).join(", ");
    return "Uploader only";
  };

  const columns = [
    {
      header: "Sheet ID",
      accessor: "sheetId",
      render: (row) => <span style={{ fontWeight: 800, color: "var(--emerald)" }}>{row.sheetId}</span>,
    },
    {
      header: "Title",
      accessor: "title",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileSpreadsheet size={16} style={{ color: "var(--emerald)" }} />
          <div>
            <div style={{ fontWeight: 700 }}>{row.title}</div>
            {row.notes && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.notes}</div>}
          </div>
        </div>
      ),
    },
    {
      header: "File",
      accessor: "file",
      render: (row) =>
        row.file?.url ? (
          <a href={row.file.url} target="_blank" rel="noreferrer" download style={{ color: "var(--emerald)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Download size={14} /> Download
          </a>
        ) : (
          "-"
        ),
    },
    { header: "Uploaded By", accessor: "uploadedBy", render: (row) => row.uploadedBy?.name || "-" },
    { header: "Access", accessor: "assignedTo", render: (row) => accessLabel(row) },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "-"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => {
        const isUploader = idOf(row.uploadedBy) === (user?._id || user?.id);
        return (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {canGrant && (
              <button className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px" }} onClick={() => openAccess(row)}>
                <UserPlus size={14} /> Give Access
              </button>
            )}
            {(canGrant || isUploader) && (
              <button className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px", color: "var(--danger)" }} onClick={() => removeSheet(row)}>
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner text="Loading Excel sheets..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Excel"
        title="Excel Document Upload"
        subtitle={
          canGrant
            ? "Upload Excel sheets and choose who can see them (Sales and Billing)"
            : "Excel sheets assigned to you, and your own uploads"
        }
        action={
          <button className="btn-primary" onClick={() => { resetUpload(); setUploadOpen(true); }}>
            <Plus size={16} /> Upload Excel
          </button>
        }
      />

      <DataTable columns={columns} data={sheets} pageSize={15} emptyMessage="No Excel sheets available." />

      {/* Upload modal */}
      <Modal isOpen={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} title="Upload Excel Sheet" size="lg">
        <form onSubmit={submitUpload}>
          <div style={{ display: "grid", gap: "16px" }}>
            <FormField label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="e.g. November sales sheet" />
            </FormField>

            <FormField label="Notes">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inputStyle} placeholder="Optional" />
            </FormField>

            <FormField label="Excel File (.xlsx, .xls, .csv)" required>
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                style={inputStyle}
              />
            </FormField>

            {canGrant && (
              <FormField label="Who can see this sheet?">
                <RecipientPicker
                  value={form}
                  recipients={recipients}
                  onChange={(next) => setForm({ ...form, accessAll: next.accessAll, assignedTo: next.assignedTo })}
                />
              </FormField>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-ghost" disabled={uploading} onClick={() => setUploadOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              <Upload size={15} /> {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Give access modal */}
      <Modal isOpen={Boolean(accessSheet)} onClose={() => setAccessSheet(null)} title="Give Access" size="md">
        <p style={{ fontWeight: 700, marginBottom: "4px" }}>{accessSheet?.sheetId} - {accessSheet?.title}</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Selected people will see this sheet and its ID in their Excel section.
        </p>
        <RecipientPicker value={accessForm} recipients={recipients} onChange={setAccessForm} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
          <button className="btn-ghost" disabled={savingAccess} onClick={() => setAccessSheet(null)}>Cancel</button>
          <button className="btn-primary" disabled={savingAccess} onClick={saveAccess}>
            {savingAccess ? "Saving..." : "Save Access"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
