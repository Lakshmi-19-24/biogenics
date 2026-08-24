import { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";

import StatusBadge from "../../components/ui/StatusBadge";

import LoadingSpinner from "../../components/ui/LoadingSpinner";

import EmptyState from "../../components/ui/EmptyState";

import API, { apiData } from "../../services/api";

import { ArrowLeft, Phone, Mail, Building, MapPin, Calendar, MessageSquare, User } from "lucide-react";

export default function LeadDetail() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [lead, setLead] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async()=>{ try{const r=await API.get(`/leads/${id}`);setLead(apiData(r));}catch(error){console.error("Failed to load lead:", error.response?.data || error.message);setLead(null);} finally{setLoading(false);} })(); },[id]);

  if (loading) return <LoadingSpinner text="Loading lead…"/>;

  if (!lead) return (

    <div><button onClick={()=>navigate("/leads")} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"13px",fontWeight:500,marginBottom:"24px",padding:0}}><ArrowLeft size={15}/>Back to Leads</button>

    <EmptyState icon={User} title="Lead not found" description="This lead doesn't exist or was deleted."/></div>

  );

  const info = [

    {icon:Phone,   label:"Phone",   value:lead.phone},

    {icon:Mail,    label:"Email",   value:lead.email||"—"},

    {icon:Building,label:"Company", value:lead.company||"—"},

    {icon:MapPin,  label:"Source",  value:lead.source||"—"},

    {icon:Calendar,label:"Created", value:lead.createdAt?new Date(lead.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"—"},

  ];

  return (

    <div className="page-enter" style={{maxWidth:"620px"}}>

      <button onClick={()=>navigate("/leads")} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"13px",fontWeight:500,marginBottom:"24px",padding:0,transition:"color var(--t)"}}

        onMouseEnter={e=>e.currentTarget.style.color="var(--emerald)"}

        onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>

        <ArrowLeft size={15}/>Back to Leads

      </button>

      <div style={{background:"var(--surface)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",padding:"24px"}}>

        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"24px"}}>

          <div style={{display:"flex",alignItems:"center",gap:"14px"}}>

            <div style={{width:"52px",height:"52px",borderRadius:"16px",background:"linear-gradient(135deg,#2563EB,#60A5FA)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"20px",fontWeight:800,fontFamily:"'Bricolage Grotesque',sans-serif",flexShrink:0}}>

              {(lead.name||"?").charAt(0).toUpperCase()}

            </div>

            <div>

              <h1 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"22px",fontWeight:800,color:"var(--text)",letterSpacing:"-0.03em"}}>{lead.name}</h1>

              <p style={{fontSize:"13px",color:"var(--text-muted)",marginTop:"2px"}}>{lead.company||"No company"}</p>

            </div>

          </div>

          <StatusBadge status={lead.status}/>

        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>

          {info.map(({icon:Icon,label,value})=>(

            <div key={label} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"13px 15px",borderRadius:"var(--r)",background:"var(--surface-2)",border:"1px solid var(--border)"}}>

              <div style={{width:"32px",height:"32px",borderRadius:"9px",background:"var(--emerald-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>

                <Icon size={14} style={{color:"var(--emerald)"}}/>

              </div>

              <div>

                <p style={{fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</p>

                <p style={{fontSize:"13px",fontWeight:500,color:"var(--text)",marginTop:"2px"}}>{value}</p>

              </div>

            </div>

          ))}

        </div>

        {lead.notes&&(

          <div style={{marginTop:"14px",padding:"14px 16px",borderRadius:"var(--r)",background:"var(--surface-2)",border:"1px solid var(--border)"}}>

            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}><MessageSquare size={13} style={{color:"var(--emerald)"}}/><p style={{fontSize:"10px",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Notes</p></div>

            <p style={{fontSize:"13px",color:"var(--text-3)",lineHeight:1.65}}>{lead.notes}</p>

          </div>

        )}

      </div>

    </div>

  );

}

