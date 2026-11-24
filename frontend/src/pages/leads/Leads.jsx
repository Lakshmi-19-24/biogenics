import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import API, { collection } from "../../services/api";
import DataTable from "../../components/ui/DataTable";

import StatusBadge from "../../components/ui/StatusBadge";

import Modal from "../../components/ui/Modal";

import LoadingSpinner from "../../components/ui/LoadingSpinner";

import PageHeader from "../../components/ui/PageHeader";

import FormField from "../../components/ui/FormField";
import {
  fetchLeads,
  fetchLeadSummary,
  saveLead
} from "../../store/slices/leadsSlice";
import toast from "react-hot-toast";

import { Plus, Users, Phone, Mail, Building, UserPlus } from "lucide-react";



const S = ["New","Contacted","Qualified","Converted","Lost"];

const SC = { New:"#3B82F6", Contacted:"#60A5FA", Qualified:"#F59E0B", Converted:"#10B981", Lost:"#EF4444" };

const SB = { New:"rgba(37,99,235,0.15)", Contacted:"rgba(96,165,250,0.12)", Qualified:"rgba(245,158,11,0.12)", Converted:"rgba(16,185,129,0.12)", Lost:"rgba(239,68,68,0.12)" };

const IS = { width:"100%", fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:"14px", color:"var(--text)", background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 14px", outline:"none" };

const ISL = { ...IS, paddingLeft:"38px" };

const fb = e => { e.target.style.borderColor="var(--emerald)"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; };

const bb = e => { e.target.style.borderColor="var(--border)"; e.target.style.boxShadow="none"; };



export default function Leads() {

  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [filter, setFilter] = useState("All");
  
const { user } = useAuth();
const [salespeople, setSalespeople] = useState([]);
const [selectedSalesperson, setSelectedSalesperson] = useState("All");


const [leadSummary, setLeadSummary] = useState({
  total: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  converted: 0,
  lost: 0,
});



  const [form, setForm] = useState({ name:"", email:"", phone:"", company:"", status:"New", source:"", notes:"" });

  const [editId, setEditId] = useState(null);
  const dispatch = useDispatch();
  const storeLeads = useSelector((state) => state.leads.items);

 useEffect(() => {
  load();
  loadLeadSummary("All");
}, []);

  
useEffect(() => {
  if (user?.role !== "owner") return;

  const loadSalespeople = async () => {
    try {
      const response = await API.get(
        
"/users?role=sales&isActive=true&limit=100"

      );
      setSalespeople(collection(response.raw));
    } catch (error) {
      console.error("Failed to load salespeople:", error);
      toast.error("Could not load salespeople");
    }
  };

  loadSalespeople();
}, [user?.role]);


  const load = async () => {
    try { const items = await dispatch(fetchLeads()).unwrap(); setLeads(items); } catch {}
    finally { setLoading(false); }

  };
  
  useEffect(() => {
  if (selectedSalesperson === "All") {
    setLeads(storeLeads);
  }
}, [storeLeads, selectedSalesperson]);

  const submit = async e => {

    e.preventDefault();

    if (!form.name||!form.phone) { toast.error("Name and phone required"); return; }

    try {
      await dispatch(saveLead({ id: editId, lead: form })).unwrap();
      toast.success(editId ? "Lead updated" : "Lead created");
      setOpen(false); reset();
    } catch { toast.error("Failed to save lead"); }

  };

  
const loadLeadSummary = async (createdBy) => {
  try {
    const summary = await dispatch(
      fetchLeadSummary(createdBy === "All" ? undefined : createdBy)
    ).unwrap();

    setLeadSummary(summary);
  } catch (error) {
    console.error("Failed to load lead summary:", error);
    toast.error("Failed to load lead performance");
  }
};


  const reset = () => { setForm({name:"",email:"",phone:"",company:"",status:"New",source:"",notes:""}); setEditId(null); };

  const openEdit = l => { setForm({name:l.name||"",email:l.email||"",phone:l.phone||"",company:l.company||"",status:l.status||"New",source:l.source||"",notes:l.notes||""}); setEditId(l._id||l.id); setOpen(true); };

  const filtered = filter==="All" ? leads : leads.filter(l=>l.status===filter);




const cols = [
  {
    header: "Name",
    accessor: "name",
    render: (r) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: "13.5px" }}>{r.name}</p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
          {r.company || "—"}
        </p>
      </div>
    ),
  },
  {
    header: "Created By",
    accessor: "createdBy",
    render: (r) => (
      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        {typeof r.createdBy === "object"
          ? r.createdBy?.name || "—"
          : "—"}
      </span>
    ),
  },
  {
    header: "Phone",
    accessor: "phone",
    render: (r) => (
      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-3)" }}>
        {r.phone}
      </span>
    ),
  },
  {
    header: "Email",
    accessor: "email",
    render: (r) => (
      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        {r.email || "—"}
      </span>
    ),
  },
  {
    header: "Source",
    accessor: "source",
    render: (r) =>
      r.source ? (
        <span style={{
          fontSize: "12px",
          padding: "3px 8px",
          borderRadius: "6px",
          background: "var(--surface-3)",
          color: "var(--text-3)",
          border: "1px solid var(--border)"
        }}>
          {r.source}
        </span>
      ) : (
        <span style={{ color: "var(--text-muted)" }}>—</span>
      ),
  },
  {
    header: "Status",
    accessor: "status",
    render: (r) => <StatusBadge status={r.status} />,
  },
];



  if (loading) return <LoadingSpinner text="Loading leads…"/>;

  return (

    <div className="page-enter">

      <PageHeader eyebrow="CRM" title="Leads" subtitle={`${leads.length} total leads in pipeline`} action={

        <button className="btn-primary" onClick={()=>{ reset(); setOpen(true); }}><Plus size={16}/>Add Lead</button>

      }/>
       


       
{user?.role === "owner" && (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor="salesperson-filter"
      style={{ marginRight: "12px", fontWeight: 600 }}
    >
      Filter by Salesperson:
    </label>

    <select
      id="salesperson-filter"
      value={selectedSalesperson}
      onChange={(e) => {
        const value = e.target.value;
        setSelectedSalesperson(value);
        loadLeadSummary(value);
        setLoading(true);

        dispatch(fetchLeads(value === "All" ? undefined : value))
          .unwrap()
          .then((items) => setLeads(items))
          .catch(() => toast.error("Failed to filter leads"))
          .finally(() => setLoading(false));
      }}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    >
      <option value="All">All Salespeople</option>

      {salespeople.map((person) => (
        <option key={person._id} value={person._id}>
          {person.name}
        </option>
      ))}
    </select>
  </div>
)}



  
      {/* Pipeline cards */}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"12px",marginBottom:"20px"}}>

        {S.map(s=>{

          
const count = leadSummary[s.toLowerCase()] ?? 0;


          const active = filter===s;

          return (

            <button key={s} onClick={()=>setFilter(active?"All":s)} style={{

              padding:"16px",borderRadius:"14px",background:active?SB[s]:"var(--surface)",

              border:`1.5px solid ${active?SC[s]:"var(--border)"}`,cursor:"pointer",textAlign:"left",

              boxShadow:active?"var(--shadow-md)":"var(--shadow-xs)",transition:"all var(--t)", borderLeft:`3px solid ${SC[s]}`,

            }}>

              <p style={{fontSize:"26px",fontWeight:800,color:"var(--text)",letterSpacing:0,lineHeight:1}}>{count}</p>

              <p style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px",fontWeight:500}}>{s}</p>

            </button>

          );

        })}

      </div>



      {/* Filter pills */}

      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"16px"}}>

        {["All",...S].map(s=>(

          <button key={s} onClick={()=>setFilter(s)} style={{

            padding:"6px 14px",borderRadius:"100px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:"1.5px solid",transition:"all var(--t)",

            background:filter===s?"var(--emerald)":"var(--surface)",

            color:filter===s?"white":"var(--text-3)",

            borderColor:filter===s?"var(--emerald)":"var(--border)",

          }}>

            {s}{s!=="All"&&` (${leadSummary[s.toLowerCase()] ?? 0})`}

          </button>

        ))}

      </div>



      <DataTable columns={cols} data={filtered} pageSize={10} onRowClick={openEdit} emptyIcon={UserPlus} emptyTitle="No leads in pipeline" emptyMessage="Start by adding your first lead to track your sales journey." emptyAction={()=>{ reset(); setOpen(true); }} emptyActionLabel="+ Add Lead"/>



      <Modal isOpen={open} onClose={()=>{setOpen(false);reset();}} title={editId?"Edit Lead":"Add New Lead"} size="lg">

        <form onSubmit={submit}>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>

            {[{l:"Name",f:"name",icon:Users,t:"text",ph:"Lead name"},{l:"Phone",f:"phone",icon:Phone,t:"tel",ph:"+91 98765 43210"},{l:"Email",f:"email",icon:Mail,t:"email",ph:"email@example.com"},{l:"Company",f:"company",icon:Building,t:"text",ph:"Company name"}].map(({l,f,icon:Icon,t,ph})=>(

              <FormField key={f} label={l}>

                <div style={{position:"relative"}}>

                  <Icon size={14} style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>

                  <input type={t} value={form[f]} placeholder={ph} onChange={e=>setForm({...form,[f]:e.target.value})}

                    style={{...ISL}} onFocus={fb} onBlur={bb}/>

                </div>

              </FormField>

            ))}

            <FormField label="Status">

              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{...IS,cursor:"pointer"}} onFocus={fb} onBlur={bb}>

                {S.map(s=><option key={s} value={s}>{s}</option>)}

              </select>

            </FormField>

            <FormField label="Source">

              <select value={form.source} onChange={e=>setForm({...form,source:e.target.value})} style={{...IS,cursor:"pointer"}} onFocus={fb} onBlur={bb}>

                <option value="">Select source</option>

                {["Website","Referral","Cold Call","Social Media","Exhibition","Other"].map(s=><option key={s} value={s}>{s}</option>)}

              </select>

            </FormField>

          </div>

          <FormField label="Notes">

            <textarea value={form.notes} rows={3} placeholder="Additional notes…" onChange={e=>setForm({...form,notes:e.target.value})}

              style={{...IS,resize:"none",lineHeight:1.6}} onFocus={fb} onBlur={bb}/>

          </FormField>

          <div style={{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"20px",paddingTop:"16px",borderTop:"1px solid var(--border)"}}>

            <button type="button" className="btn-ghost" onClick={()=>{setOpen(false);reset();}}>Cancel</button>

            <button type="submit" className="btn-primary">{editId?"Update Lead":"Create Lead"}</button>

          </div>

        </form>

      </Modal>

    </div>

  );

}

