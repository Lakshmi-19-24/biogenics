import { Inbox } from "lucide-react";
export default function EmptyState({ icon:Icon=Inbox, title="No data yet", description="Data will appear here once available.", action, actionLabel="Add New" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"42px 20px", textAlign:"center" }}>
      <div style={{ width:"58px", height:"58px", borderRadius:"16px", background:"var(--emerald-dim)", border:"1px solid var(--emerald-border)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
        <Icon size={26} style={{ color:"var(--emerald-bright)" }} />
      </div>
      <h3 style={{ fontSize:"16px", fontWeight:700, color:"var(--text)", marginBottom:"8px" }}>{title}</h3>
      <p style={{ fontSize:"14px", color:"var(--text-muted)", maxWidth:"320px", lineHeight:1.6 }}>{description}</p>
      {action && (
        <button onClick={action} className="btn-primary" style={{ marginTop:"20px" }}>{actionLabel}</button>
      )}
    </div>
  );
}
