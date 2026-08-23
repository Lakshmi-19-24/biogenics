import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, ShoppingCart, Package, ClipboardList,
  MapPin, Clock, CreditCard, Bell, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { FileText, Target as TargetIcon, ClipboardCheck, Boxes, Receipt, LineChart, UserCog } from "lucide-react";
import AnimatedLogo from "../AnimatedLogo";

const NAV = {
  owner: [
    { to:"/owner",        icon:LayoutDashboard, label:"Dashboard",     group:"Main" },
    { to:"/register",     icon:UserCog,         label:"Create User",   group:"Admin" },
    { to:"/leads",        icon:Users,           label:"Leads / CRM" },
    { to:"/customers",    icon:Users,           label:"Customers" },
    { to:"/orders",       icon:ShoppingCart,    label:"Orders" },
    { to:"/products",     icon:Package,         label:"Products" },
    { to:"/activity",     icon:ClipboardList,   label:"Daily Activity",group:"Operations" },
    { to:"/attendance",   icon:Clock,           label:"Attendance" },
    { to:"/daily-reports",icon:ClipboardCheck,  label:"Daily Reports" },
    { to:"/targets",      icon:TargetIcon,      label:"Targets" },
    { to:"/reminders",    icon:Bell,            label:"Reminders" },
    { to:"/payments",     icon:CreditCard,      label:"Payments" },
    { to:"/quotations",   icon:FileText,        label:"Quotations",    group:"Finance" },
    { to:"/invoices",     icon:Receipt,         label:"Invoices" },
    { to:"/inventory",    icon:Boxes,           label:"Inventory" },
    { to:"/documents",    icon:FileText,        label:"Documents",     group:"System" },
    { to:"/tracking",     icon:MapPin,          label:"GPS Tracking" },
    { to:"/notifications",icon:Bell,            label:"Notifications", group:"System" },
    { to:"/reports",      icon:BarChart3,       label:"Reports" },
    { to:"/analytics",    icon:LineChart,       label:"Analytics" },
    { to:"/users",        icon:UserCog,         label:"Users & Roles", group:"Admin" },
    { to:"/settings",     icon:Settings,        label:"Settings" },
  ],
  admin:   [
    { to:"/admin",        icon:LayoutDashboard, label:"Dashboard",     group:"Main" },
    { to:"/register",     icon:UserCog,         label:"Create User",   group:"Admin" },
    { to:"/leads",        icon:Users,           label:"Leads / CRM" },
    { to:"/customers",    icon:Users,           label:"Customers" },
    { to:"/orders",       icon:ShoppingCart,    label:"Orders" },
    { to:"/products",     icon:Package,         label:"Products" },
    { to:"/activity",     icon:ClipboardList,   label:"Daily Activity",group:"Operations" },
    { to:"/attendance",   icon:Clock,           label:"Attendance" },
    { to:"/daily-reports",icon:ClipboardCheck,  label:"Daily Reports" },
    { to:"/targets",      icon:TargetIcon,      label:"Targets" },
    { to:"/reminders",    icon:Bell,            label:"Reminders" },
    { to:"/payments",     icon:CreditCard,      label:"Payments" },
    { to:"/quotations",   icon:FileText,        label:"Quotations",    group:"Finance" },
    { to:"/invoices",     icon:Receipt,         label:"Invoices" },
    { to:"/inventory",    icon:Boxes,           label:"Inventory" },
    { to:"/documents",    icon:FileText,        label:"Documents",     group:"System" },
    { to:"/tracking",     icon:MapPin,          label:"GPS Tracking" },
    { to:"/notifications",icon:Bell,            label:"Notifications", group:"System" },
    { to:"/reports",      icon:BarChart3,       label:"Reports" },
    { to:"/analytics",    icon:LineChart,       label:"Analytics" },
    { to:"/users",        icon:UserCog,         label:"Users & Roles", group:"Admin" },
    { to:"/settings",     icon:Settings,        label:"Settings" },
  ],
  manager: [
    { to:"/manager",      icon:LayoutDashboard, label:"Dashboard",     group:"Main" },
    { to:"/leads",        icon:Users,           label:"Leads / CRM" },
    { to:"/customers",    icon:Users,           label:"Customers" },
    { to:"/orders",       icon:ShoppingCart,    label:"Orders" },
    { to:"/products",     icon:Package,         label:"Products" },
    { to:"/activity",     icon:ClipboardList,   label:"Daily Activity",group:"Operations" },
    { to:"/attendance",   icon:Clock,           label:"Attendance" },
    { to:"/daily-reports",icon:ClipboardCheck,  label:"Daily Reports" },
    { to:"/targets",      icon:TargetIcon,      label:"Targets" },
    { to:"/reminders",    icon:Bell,            label:"Reminders" },
    { to:"/payments",     icon:CreditCard,      label:"Payments" },
    { to:"/quotations",   icon:FileText,        label:"Quotations",    group:"Finance" },
    { to:"/invoices",     icon:Receipt,         label:"Invoices" },
    { to:"/inventory",    icon:Boxes,           label:"Inventory" },
    { to:"/documents",    icon:FileText,        label:"Documents",     group:"System" },
    { to:"/tracking",     icon:MapPin,          label:"GPS Tracking" },
    { to:"/notifications",icon:Bell,            label:"Notifications", group:"System" },
    { to:"/reports",      icon:BarChart3,       label:"Reports" },
    { to:"/analytics",    icon:LineChart,       label:"Analytics" },
    { to:"/users",        icon:UserCog,         label:"Users & Roles", group:"Admin" },
    { to:"/settings",     icon:Settings,        label:"Settings" },
  ],
  sales:   [
    { to:"/sales",        icon:LayoutDashboard, label:"Dashboard",     group:"Main" },
    { to:"/leads",        icon:Users,           label:"Leads / CRM" },
    { to:"/customers",    icon:Users,           label:"Customers" },
    { to:"/orders",       icon:ShoppingCart,    label:"Orders" },
    { to:"/products",     icon:Package,         label:"Products" },
    { to:"/activity",     icon:ClipboardList,   label:"Daily Activity",group:"Operations" },
    { to:"/attendance",   icon:Clock,           label:"Attendance" },
    { to:"/payments",     icon:CreditCard,      label:"Payments" },
    { to:"/notifications",icon:Bell,            label:"Notifications", group:"System" },
    { to:"/daily-reports/submit", icon:ClipboardCheck, label:"Submit Report" },
    { to:"/daily-reports", icon:ClipboardCheck, label:"My Reports" },
    { to:"/targets",      icon:TargetIcon,      label:"Targets" },
    { to:"/reminders",    icon:Bell,            label:"Reminders" },
    { to:"/documents",    icon:FileText,        label:"Documents" },
    { to:"/settings",     icon:Settings,        label:"Settings" },
  ],
};

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || "sales";
  const items = NAV[role] || NAV.sales;
  const initials = (user?.name || "U").slice(0, 2).toUpperCase();
  const roleColors = { owner:"#7c3aed", admin:"#2563EB", manager:"#0369a1", sales:"#d97706" };
  const roleLabel  = { owner:"Owner", admin:"Administrator", manager:"Manager", sales:"Sales Executive" };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={closeMobile} style={{ position:"fixed",inset:0,zIndex:40,background:"rgba(10,15,30,0.72)",backdropFilter:"blur(4px)" }} className="lg:hidden" />
      )}

      <aside style={{
        position:"fixed",top:0,left:0,zIndex:50,height:"100vh",
        width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
        background:"var(--sidebar-bg)",
        display:"flex",flexDirection:"column",
        borderRight:"1px solid var(--sidebar-border)",
        boxShadow:"var(--sidebar-shadow)",
        transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflow:"hidden",
      }}
      className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        {/* Brand */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px",height:"68px",borderBottom:"1px solid var(--sidebar-border)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px",flex:1,minWidth:0 }}>
            <AnimatedLogo size={48} showText={false} />
            {!collapsed && (
              <div style={{ minWidth:0,flex:1 }}>
                <p style={{ color:"var(--text)",fontWeight:800,fontSize:"13px",whiteSpace:"nowrap",letterSpacing:0,lineHeight:1.2,overflow:"visible" }}>Bio-Genics Lifecare</p>
                <p style={{ color:"var(--text-muted)",fontSize:"10px",whiteSpace:"nowrap",overflow:"visible" }}>Sales Automation</p>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button onClick={closeMobile} style={{ background:"var(--control-bg)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--text-muted)",padding:"4px",borderRadius:"8px" }} className="mobile-only"><X size={17}/></button>
          {/* Collapse toggle */}
          <button onClick={toggle} style={{ background:"var(--control-bg)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--text-muted)",padding:"4px",borderRadius:"8px",transition:"background var(--t)" }} className="desktop-only"
            onMouseEnter={e=>e.currentTarget.style.background="var(--control-hover)"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--control-bg)"}>
            {collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
          </button>
        </div>

        {/* User pill */}
        {!collapsed && (
          <div style={{ margin:"12px",padding:"12px",borderRadius:"12px",background:"var(--control-bg)",border:"1px solid var(--border)",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
              <div style={{ width:"34px",height:"34px",borderRadius:"50%",background:`linear-gradient(135deg,${roleColors[role]||"#2563EB"},rgba(59,130,246,0.85))`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:"12px",flexShrink:0 }}>
                {initials}
              </div>
              <div style={{ overflow:"hidden",flex:1 }}>
                <p style={{ fontSize:"13px",fontWeight:700,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.25 }}>{user?.name||"User"}</p>
                <p style={{ fontSize:"11px",color:"var(--emerald)",fontWeight:500 }}>{roleLabel[role]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1,overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:"2px" }}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to}>
                {item.group && !collapsed && (
                  <p style={{ fontSize:"10px",fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",color:"var(--text-placeholder)",padding:"14px 10px 6px",lineHeight:1 }}>{item.group}</p>
                )}
                <NavLink to={item.to} end={item.to.split("/").length<=2} onClick={closeMobile} style={{ textDecoration:"none" }}
                  className={({ isActive }) => isActive ? "nav-link-active" : ""}>
                  {({ isActive }) => (
                    <div style={{
                      display:"flex",alignItems:"center",gap:"10px",
                      padding: collapsed ? "10px 0" : "10px 12px",
                      borderRadius:"8px",cursor:"pointer",
                      justifyContent: collapsed ? "center" : "flex-start",
                      background: isActive ? "var(--sidebar-active)" : "transparent",
                      borderLeft: isActive ? "2px solid #2563EB" : "2px solid transparent",
                      transition:"all var(--t)",
                    }}
                    onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="var(--sidebar-hover)"; }}
                    onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
                      <Icon size={18} style={{ color:isActive?"var(--sidebar-text-active)":"var(--text-3)",flexShrink:0,transition:"color var(--t)" }} />
                      {!collapsed && (
                        <span style={{ color:isActive?"var(--sidebar-text-active)":"var(--sidebar-link)",fontSize:"14px",fontWeight:isActive?700:500,whiteSpace:"nowrap",transition:"color var(--t)" }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding:"10px",borderTop:"1px solid var(--sidebar-border)",flexShrink:0 }}>
          <button onClick={()=>{ logout(); navigate("/"); }} style={{
            display:"flex",alignItems:"center",gap:"10px",width:"100%",
            padding: collapsed ? "10px 0" : "9px 10px",
            borderRadius:"10px",background:"none",border:"none",cursor:"pointer",
            justifyContent: collapsed ? "center" : "flex-start",
            transition:"background var(--t)",
          }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(220,38,38,0.07)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <LogOut size={18} style={{ color:"var(--danger)",flexShrink:0,opacity:0.7 }} />
            {!collapsed && <span style={{ color:"var(--danger)",fontSize:"13px",fontWeight:500,opacity:0.8 }}>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
