const blue = { bg:"rgba(37,99,235,0.14)", c:"#60A5FA", dot:"#60A5FA" };
const green = { bg:"rgba(16,185,129,0.12)", c:"#10B981", dot:"#10B981" };
const amber = { bg:"rgba(245,158,11,0.13)", c:"#F59E0B", dot:"#F59E0B" };
const red = { bg:"rgba(239,68,68,0.13)", c:"#EF4444", dot:"#EF4444" };
const muted = { bg:"rgba(148,163,184,0.12)", c:"#94A3B8", dot:"#64748B" };

const MAP = {
  new:blue, contacted:blue, qualified:amber, converted:green, lost:red,
  pending:amber, confirmed:blue, shipped:blue, delivered:green, cancelled:red,
  paid:green, partial:amber, overdue:red,
  present:green, absent:red, late:amber, "half-day":blue,
  active:green, inactive:red, blocked:red,
  read:muted, unread:blue,
  owner:blue, admin:blue, manager:amber, sales:green,
  "in stock":green, "low stock":amber, "out of stock":red,
  valid:green, expired:red, "expiring soon":amber,
};

export default function StatusBadge({ status }) {

  const s = MAP[(status||"").toLowerCase()] || muted;

  return (

    <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"4px 10px", borderRadius:"6px", background:s.bg, color:s.c, fontSize:"12px", fontWeight:700, letterSpacing:0 }}>

      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.dot, flexShrink:0 }} />

      {status}

    </span>

  );

}

