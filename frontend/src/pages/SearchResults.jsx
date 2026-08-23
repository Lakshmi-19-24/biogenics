import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowRight, Users, ShoppingCart, Package, CreditCard, FileText, Bell, BarChart3, Settings, MapPin, Clock } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";

const MODULES = [
  { title:"Leads / CRM", path:"/leads", description:"Lead records, follow ups, and customer pipeline", icon:Users, keywords:["lead","leads","crm","prospect"] },
  { title:"Customers", path:"/customers", description:"Customer list and interaction history", icon:Users, keywords:["customer","customers","client","clients"] },
  { title:"Orders", path:"/orders", description:"Sales orders, order status, and order details", icon:ShoppingCart, keywords:["order","orders","sale","sales"] },
  { title:"Products", path:"/products", description:"Product catalog and product details", icon:Package, keywords:["product","products","catalog"] },
  { title:"Payments", path:"/payments", description:"Payment entries, pending collections, and overdue amounts", icon:CreditCard, keywords:["payment","payments","paid","pending","finance"] },
  { title:"Quotations", path:"/quotations", description:"Quotation records and billing pipeline", icon:FileText, keywords:["quote","quotation","quotations"] },
  { title:"Invoices", path:"/invoices", description:"Invoice records and billing status", icon:FileText, keywords:["invoice","invoices","bill","billing"] },
  { title:"Attendance", path:"/attendance", description:"Attendance records and working hours", icon:Clock, keywords:["attendance","time","clock"] },
  { title:"Daily Activity", path:"/activity", description:"Daily sales activity and field updates", icon:Clock, keywords:["activity","daily","work"] },
  { title:"Daily Reports", path:"/daily-reports", description:"Submitted daily reports", icon:FileText, keywords:["report","reports","daily report"] },
  { title:"GPS Tracking", path:"/tracking", description:"Live location and sales team tracking", icon:MapPin, keywords:["gps","tracking","location","map"] },
  { title:"Notifications", path:"/notifications", description:"System alerts and user notifications", icon:Bell, keywords:["notification","notifications","alert","alerts"] },
  { title:"Reports", path:"/reports", description:"Business reports and summaries", icon:BarChart3, keywords:["report","reports","analytics"] },
  { title:"Analytics", path:"/analytics", description:"High level business analytics", icon:BarChart3, keywords:["analytics","insights","dashboard"] },
  { title:"Settings", path:"/settings", description:"Account and application settings", icon:Settings, keywords:["settings","setting","profile"] },
];

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const normalized = query.toLowerCase();

  const results = normalized
    ? MODULES.filter((item) => {
        const haystack = [item.title, item.description, ...item.keywords].join(" ").toLowerCase();
        return haystack.includes(normalized) || item.keywords.some((key) => normalized.includes(key));
      })
    : [];

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for "${query}"` : "Search"}
        subtitle="Find and open sales automation modules"
      />

      {results.length ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"14px" }}>
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration:"none" }}>
                <div className="card" style={{ height:"100%", padding:"18px", display:"flex", alignItems:"center", gap:"14px", transition:"transform var(--t), box-shadow var(--t)" }}>
                  <div style={{ width:"42px", height:"42px", borderRadius:"12px", background:"var(--emerald-dim)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={20} style={{ color:"var(--emerald-dark)" }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontSize:"15px", fontWeight:700, color:"var(--text)", lineHeight:1.25 }}>{item.title}</h3>
                    <p style={{ marginTop:"3px", fontSize:"12px", color:"var(--text-muted)", lineHeight:1.45 }}>{item.description}</p>
                  </div>
                  <ArrowRight size={17} style={{ color:"var(--text-muted)", flexShrink:0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={query ? "No matching modules found" : "Type a search term"}
          description={query ? "Try searching for orders, payments, customers, reports, or settings." : "Use the top search box to find a module."}
        />
      )}
    </div>
  );
}
