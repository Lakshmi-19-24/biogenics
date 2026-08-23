import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { Menu, Bell, Search, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { apiItems } from "../../services/api";
import { initSocket, offNotification, onNotification } from "../../services/socket";

const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";
const isUnread = (notification) => !notification.read && !notification.readAt;

export default function Topbar() {
  const { toggle, openMobile } = useSidebar();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [so, setSo] = useState(false);
  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const RL = { owner: "Owner", admin: "Administrator", manager: "Manager", sales: "Sales Executive" };
  const RC = { owner: "#4F46E5", admin: "#2563EB", manager: "#0369A1", sales: "#D97706" };
  const initials = (user?.name || "U").slice(0, 2).toUpperCase();
  const bStyle = { background: "transparent", border: "none", cursor: "pointer", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", color: "var(--text-3)", transition: "all var(--t)" };
  const roleColor = RC[user?.role] || "#2563EB";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadUnreadCount = useCallback(async () => {
    if (!user || !token) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await API.get("/notifications?limit=100");
      setUnreadCount(apiItems(response).filter(isUnread).length);
    } catch {
      setUnreadCount(0);
    }
  }, [user, token]);

  useEffect(() => {
    loadUnreadCount();
    if (token) initSocket(token);

    const handleNotification = (notification) => {
      if (isUnread(notification)) setUnreadCount((count) => count + 1);
    };
    const handleNotificationsChanged = () => loadUnreadCount();

    onNotification(handleNotification);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    return () => {
      offNotification(handleNotification);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    };
  }, [loadUnreadCount, token]);

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSo(false);
      setQuery("");
    }
  };

  return (
    <header style={{ height: "var(--topbar-h)", background: "var(--topbar-bg)", borderBottom: "1px solid var(--topbar-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={openMobile} style={bStyle} className="mobile-only"
          onMouseEnter={e => e.currentTarget.style.background = "var(--control-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Menu size={20} />
        </button>

        <button onClick={toggle} style={bStyle} className="desktop-only"
          onMouseEnter={e => e.currentTarget.style.background = "var(--control-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Menu size={20} />
        </button>

        <div className="hidden md:flex">
          {so ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--control-bg)", border: "1px solid var(--emerald)", borderRadius: "8px", padding: "7px 12px", width: "300px", boxShadow: "0 0 0 3px rgba(37,99,235,0.14)" }} className="anim-scale-up">
              <Search size={14} style={{ color: "var(--emerald-bright)", flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search anything..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") { setSo(false); setQuery(""); } }}
                onBlur={() => { setTimeout(() => { setSo(false); setQuery(""); }, 150); }}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "var(--text)", width: "100%", fontFamily: "inherit" }}
              />
            </div>
          ) : (
            <button onClick={() => setSo(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "var(--control-bg)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", transition: "all var(--t)", minWidth: "260px" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--control-hover)"; e.currentTarget.style.borderColor = "var(--emerald-border)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--control-bg)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <Search size={14} style={{ color: "var(--text-3)" }} />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Search...</span>
              <kbd style={{ marginLeft: "auto", padding: "2px 6px", borderRadius: "5px", fontSize: "10px", background: "var(--kbd-bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "monospace" }}>Cmd K</kbd>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={() => navigate("/notifications")}
          style={{ ...bStyle, position: "relative", background: "var(--control-bg)", border: "1px solid var(--border)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--control-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--control-bg)"}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "7px", right: "7px", width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB", border: "2px solid #0D1526" }} />
          )}
        </button>

        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
          style={{ ...bStyle, background: "var(--control-bg)", border: "1px solid var(--border)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--control-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--control-bg)"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          onClick={() => navigate("/settings")}
          aria-label="Open account settings"
          title="Account settings"
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px 6px 12px", marginLeft: "2px", border: "1px solid transparent", borderLeft: "1px solid var(--border)", borderRadius: "12px", background: "transparent", cursor: "pointer", transition: "all var(--t)", textAlign: "left" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--control-hover)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.borderLeftColor = "var(--border)";
          }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "12px", flexShrink: 0, boxShadow: "var(--shadow-emerald-sm)" }}>
            {initials}
          </div>
          <div className="hidden sm:block">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{user?.name || "System Admin"}</p>
              <span style={{ fontSize: "10px", fontWeight: 800, color: roleColor, background: `${roleColor}1F`, border: `1px solid ${roleColor}55`, borderRadius: "999px", padding: "2px 7px" }}>{RL[user?.role] || "Owner"}</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>{user?.role === "owner" ? "Owner" : "Bio-Genics Lifecare"}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
