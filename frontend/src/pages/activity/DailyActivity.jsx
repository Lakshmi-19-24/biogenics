import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const IS={width:"100%",fontFamily:"Be Vietnam Pro,sans-serif",fontSize:"14px",color:"var(--text)",background:"var(--surface-2)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 14px",outline:"none"};
const fb=e=>{e.target.style.borderColor="var(--emerald)";e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)";};
const bb=e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";};

export default function DailyActivity(){
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [open,setOpen]=useState(false);
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [form,setForm]=useState({callsMade:0,leadsCreated:0,ordersBooked:0,paymentsCollected:0,summary:"",blockers:"",tomorrowPlan:""});

  useEffect(()=>{load();},[]);

  const load=async()=>{
    try{
      setError("");
      const r=await API.get("/daily-reports");
      setReports(apiItems(r));
    }catch(err){
      setError(apiErrorMessage(err,"Failed to load daily reports"));
    }finally{
      setLoading(false);
    }
  };

  const submit=async e=>{
    e.preventDefault();
    if(!form.summary){toast.error("Summary required");return;}
    try{
      await API.post("/daily-reports",{...form,reportDate:date});
      toast.success("Daily report submitted");
      setOpen(false);
      setForm({callsMade:0,leadsCreated:0,ordersBooked:0,paymentsCollected:0,summary:"",blockers:"",tomorrowPlan:""});
      load();
    }catch(err){
      toast.error(apiErrorMessage(err,"Failed to submit report"));
    }
  };

  const cols=[
    {header:"Date",accessor:"reportDate",render:r=><span style={{fontWeight:600,fontSize:"13.5px"}}>{r.reportDate||"—"}</span>},
    {header:"Employee",accessor:"employee",render:r=><span style={{fontWeight:600,fontSize:"13.5px"}}>{r.employee?.name||"—"}</span>},
    {header:"Calls",accessor:"callsMade"},
    {header:"Leads",accessor:"leadsCreated"},
    {header:"Orders",accessor:"ordersBooked"},
    {header:"Collected",accessor:"paymentsCollected",render:r=><span style={{fontWeight:700}}>₹{Number(r.paymentsCollected||0).toLocaleString()}</span>},
    {header:"Status",accessor:"status",render:r=><StatusBadge status={r.status}/>},
  ];

  if(loading) return <LoadingSpinner text="Loading activities..."/>;

  return(
    <div className="page-enter">
      <PageHeader eyebrow="DCR" title="Daily Activity" subtitle="Submit and review daily sales reports" action={
        <div style={{display:"flex",gap:"8px"}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:"9px 14px",borderRadius:"var(--r)",background:"var(--surface)",border:"1.5px solid var(--border)",fontSize:"13px",color:"var(--text)",outline:"none"}}/>
          <button className="btn-primary" onClick={()=>setOpen(true)}><Plus size={16}/>Submit Report</button>
        </div>
      }/>
      <DataTable columns={cols} data={reports} loading={loading} error={error} pageSize={15} emptyMessage="No daily reports yet."/>
      <Modal isOpen={open} onClose={()=>setOpen(false)} title="Submit Daily Report" size="lg">
        <form onSubmit={submit}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"12px",marginBottom:"16px"}}>
            {[["Calls","callsMade"],["Leads","leadsCreated"],["Orders","ordersBooked"],["Collected","paymentsCollected"]].map(([label,field])=>(
              <FormField key={field} label={label}>
                <input type="number" min="0" value={form[field]} onChange={e=>setForm({...form,[field]:Number(e.target.value)})} style={IS} onFocus={fb} onBlur={bb}/>
              </FormField>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <FormField label="Summary" required><textarea value={form.summary} rows={3} placeholder="What happened today?" onChange={e=>setForm({...form,summary:e.target.value})} style={{...IS,resize:"none",lineHeight:1.6}} onFocus={fb} onBlur={bb}/></FormField>
            <FormField label="Blockers"><textarea value={form.blockers} rows={2} placeholder="Any blockers?" onChange={e=>setForm({...form,blockers:e.target.value})} style={{...IS,resize:"none",lineHeight:1.6}} onFocus={fb} onBlur={bb}/></FormField>
            <FormField label="Tomorrow Plan"><textarea value={form.tomorrowPlan} rows={2} placeholder="Plan for tomorrow" onChange={e=>setForm({...form,tomorrowPlan:e.target.value})} style={{...IS,resize:"none",lineHeight:1.6}} onFocus={fb} onBlur={bb}/></FormField>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"20px",paddingTop:"16px",borderTop:"1px solid var(--border)"}}>
            <button type="button" className="btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Report</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
