import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useSidebar } from "../../context/SidebarContext";

export default function DashboardLayout() {
  const { collapsed } = useSidebar();
  const ml = collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)";
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ marginLeft: ml, transition: "margin-left 0.28s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }} className="lg-ml">
        <style>{`@media(max-width:1023px){ .lg-ml{ margin-left:0 !important; } }`}</style>
        <Topbar />
        <main style={{ padding: "22px 24px", flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--app-main-bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
