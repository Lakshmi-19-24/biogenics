export default function FormField({ label, children, required }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"var(--text-3)", marginBottom:"7px", textTransform:"uppercase", letterSpacing:"0.07em" }}>
        {label}{required && <span style={{ color:"var(--emerald)", marginLeft:"3px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
