export default function LoadingSpinner({ text="" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", gap:"16px" }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:"3px solid var(--border)", borderTopColor:"var(--emerald)" }} className="anim-spin" />
      {text && <p style={{ fontSize:"14px", color:"var(--text-muted)", fontWeight:500 }}>{text}</p>}
    </div>
  );
}
