export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"16px", marginBottom:"20px", flexWrap:"wrap" }}>
      <div>
        {eyebrow && <p style={{ fontSize:"11px", fontWeight:700, color:"#60A5FA", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"4px" }}>{eyebrow}</p>}
        <h1 style={{ fontSize:"24px", fontWeight:800, color:"var(--text)", letterSpacing:0, lineHeight:1.18 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:"13px", color:"var(--text-muted)", marginTop:"4px" }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  );
}
