import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export default function DataTable({ columns=[], data=[], loading=false, error="", pageSize=10, searchable=true, onRowClick, emptyMessage="No records found", emptyTitle, emptyAction, emptyActionLabel="Add New", emptyIcon:EmptyIcon=Inbox }) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => columns.some(col => String(col.accessor ? row[col.accessor] : "").toLowerCase().includes(q)));
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a,b) => {
      const cmp = String(a[sortCol]??"").localeCompare(String(b[sortCol]??""), undefined, {numeric:true});
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page-1)*pageSize, page*pageSize);

  const handleSort = (acc) => {
    if (sortCol===acc) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortCol(acc); setSortDir("asc"); }
  };

  return (
    <div style={{ background:"var(--surface)", borderRadius:"var(--r-xl)", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
      {searchable && (
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>
          <div style={{ position:"relative", maxWidth:"320px" }}>
            <Search size={14} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }} />
            <input type="text" placeholder="Search records..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="inp-base" style={{ paddingLeft:"36px", paddingTop:"8px", paddingBottom:"8px" }} />
          </div>
        </div>
      )}

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead style={{ position:"sticky", top:0, zIndex:1 }}>
            <tr style={{ background:"var(--surface-2)", borderBottom:"1px solid var(--border)" }}>
              {columns.map(col => (
                <th key={col.accessor||col.header}
                  onClick={() => col.accessor && handleSort(col.accessor)}
                  style={{ padding:"12px 20px", textAlign:"left", fontSize:"11px", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap", cursor:"pointer", userSelect:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    {col.header}
                    {sortCol===col.accessor && (sortDir==="asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} style={{ padding:"48px 20px", textAlign:"center", fontSize:"14px", color:"var(--text-muted)" }}>Loading records...</td></tr>
            ) : error ? (
              <tr><td colSpan={columns.length} style={{ padding:"48px 20px", textAlign:"center", fontSize:"14px", color:"var(--danger)" }}>{error}</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding:"44px 20px" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <div style={{ width:"54px", height:"54px", borderRadius:"16px", background:"rgba(37,99,235,0.12)", border:"1px solid rgba(37,99,235,0.28)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"14px" }}>
                    <EmptyIcon size={24} style={{ color:"#60A5FA" }} />
                  </div>
                  <p style={{ fontSize:"15px", fontWeight:700, color:"var(--text)", marginBottom:"4px" }}>{emptyTitle || emptyMessage}</p>
                  {emptyTitle && <p style={{ fontSize:"13px", color:"var(--text-muted)", maxWidth:"360px" }}>{emptyMessage}</p>}
                  {emptyAction && <button type="button" onClick={emptyAction} className="btn-primary" style={{ marginTop:"16px" }}>{emptyActionLabel}</button>}
                </div>
              </td></tr>
            ) : paginated.map((row, i) => (
              <tr key={row.id||row._id||i}
                onClick={() => onRowClick?.(row)}
                style={{ borderBottom:"1px solid var(--border)", cursor:onRowClick?"pointer":"default", transition:"background var(--t)", background:i%2?"rgba(255,255,255,0.02)":"transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => e.currentTarget.style.background=i%2?"rgba(255,255,255,0.02)":"transparent"}>
                {columns.map(col => (
                  <td key={col.accessor||col.header} style={{ padding:"13px 20px", color:"var(--text-2)", fontSize:"14px" }}>
                    {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid var(--border)", background:"var(--surface-2)" }}>
          <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>
            Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize, sorted.length)} of {sorted.length}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}
              style={{ padding:"6px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", opacity:page<=1?0.35:1 }}>
              <ChevronLeft size={16}/>
            </button>
            <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text-3)", padding:"0 8px" }}>{page}/{totalPages}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}
              style={{ padding:"6px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", opacity:page>=totalPages?0.35:1 }}>
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
