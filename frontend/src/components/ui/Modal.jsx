import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
export default function Modal({ isOpen, onClose, title, children, size="md" }) {
  const ref = useRef(null);
  useEffect(() => { document.body.style.overflow = isOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isOpen]);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const widths = { sm:"440px", md:"520px", lg:"680px", xl:"860px" };
  return createPortal(
    <div ref={ref} onClick={(e) => { if (e.target===ref.current) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", background:"rgba(10,15,30,0.78)", backdropFilter:"blur(10px)" }}
      className="anim-fade-in">
      <div style={{ width:"100%", maxWidth:widths[size], maxHeight:"calc(100vh - 48px)", display:"flex", flexDirection:"column", background:"var(--surface)", borderRadius:"var(--r-2xl)", border:"1px solid var(--border)", boxShadow:"var(--shadow-xl)", overflow:"hidden" }} className="anim-scale-up">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>
          <h3 style={{ fontSize:"17px", fontWeight:700, color:"var(--text)", letterSpacing:0 }}>{title}</h3>
          <button onClick={onClose} style={{ padding:"6px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", transition:"all var(--t)" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="var(--surface-3)"; e.currentTarget.style.color="var(--text)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--text-muted)"; }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:"24px", overflowY:"auto" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
