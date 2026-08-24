import { TrendingUp, TrendingDown } from "lucide-react";

const PALETTE = {
  primary: { bg:"rgba(37,99,235,0.15)", icon:"#60A5FA", border:"rgba(37,99,235,0.35)", accent:"#2563EB" },
  success: { bg:"rgba(16,185,129,0.12)", icon:"#10B981", border:"rgba(16,185,129,0.28)", accent:"#10B981" },
  warning: { bg:"rgba(245,158,11,0.12)", icon:"#F59E0B", border:"rgba(245,158,11,0.28)", accent:"#F59E0B" },
  danger:  { bg:"rgba(239,68,68,0.12)", icon:"#EF4444", border:"rgba(239,68,68,0.28)", accent:"#EF4444" },
  info:    { bg:"rgba(59,130,246,0.12)", icon:"#3B82F6", border:"rgba(59,130,246,0.28)", accent:"#3B82F6" },
};

export default function StatsCard({ icon:Icon, label, value, trend, trendLabel, color="primary" }) {
  const p = PALETTE[color] || PALETTE.primary;
  const displayValue = value ?? "0";
  const isPos = trend && trend > 0;
  return (
    <div style={{ background:"var(--surface)", borderRadius:"14px", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", padding:"20px", position:"relative", overflow:"hidden", transition:"box-shadow var(--t), transform var(--t)", cursor:"default" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow-md)"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.transform="translateY(0)"; }}>

      {/* Top accent bar */}
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"3px", background:p.accent, opacity:0.85 }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:"11px", fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"10px" }}>{label}</p>
          <p style={{ fontSize:"28px", fontWeight:800, color:"var(--text)", lineHeight:1, letterSpacing:0 }}>{displayValue}</p>
          {trend !== undefined && (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"12px" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"3px 8px", borderRadius:"100px", fontSize:"11px", fontWeight:700,
                background: isPos ? "rgba(5,150,105,0.10)" : "rgba(220,38,38,0.10)",
                color: isPos ? "#10B981" : "#EF4444" }}>
                {isPos ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {isPos?"+":""}{trend}%
              </span>
              {trendLabel && <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div style={{ width:"46px", height:"46px", borderRadius:"14px", background:p.bg, border:`1px solid ${p.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon size={22} style={{ color:p.icon }} />
          </div>
        )}
      </div>
    </div>
  );
}
