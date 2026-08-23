import { useState, useEffect } from "react";

import EmptyState from "../../components/ui/EmptyState";

import LoadingSpinner from "../../components/ui/LoadingSpinner";

import PageHeader from "../../components/ui/PageHeader";

import API, { apiItems } from "../../services/api";
import { offNotification, onNotification } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

import toast from "react-hot-toast";

import { Bell, Check, CheckCheck, Users, ShoppingCart, CreditCard, AlertCircle, Clock, X, CalendarClock, Target, PackageCheck } from "lucide-react";



const TABS = [{ k:"all",label:"All"},{k:"lead",label:"Leads"},{k:"order",label:"Orders"},{k:"payment",label:"Payments"},{k:"reminder",label:"Reminders"},{k:"target",label:"Targets"},{k:"stock",label:"Stock"},{k:"attendance",label:"Attendance"},{k:"system",label:"System"}];

const TICON = { lead:Users, order:ShoppingCart, payment:CreditCard, reminder:CalendarClock, target:Target, stock:PackageCheck, attendance:Clock, system:AlertCircle };

const TCOLOR = { lead:"#2563EB", order:"#0369a1", payment:"#d97706", reminder:"#7c3aed", target:"#0f766e", stock:"#9333ea", attendance:"#0891b2", system:"#dc2626" };

const TBG   = { lead:"rgba(37,99,235,0.08)", order:"rgba(3,105,161,0.08)", payment:"rgba(217,119,6,0.08)", reminder:"rgba(124,58,237,0.08)", target:"rgba(15,118,110,0.08)", stock:"rgba(147,51,234,0.08)", attendance:"rgba(8,145,178,0.08)", system:"rgba(220,38,38,0.08)" };

const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";
const notifyNotificationsChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));



export default function Notifications() {
  const { user } = useAuth();

  const [notifs,  setNotifs]  = useState([]);

  const [loading, setLoading] = useState(true);

  const [tab,     setTab]     = useState("all");



  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifs((prev) => [notification, ...prev.filter((item) => (item._id || item.id) !== (notification._id || notification.id))]);
    };

    onNotification(handleNotification);
    return () => offNotification(handleNotification);
  }, []);

  const load = async () => { try { const r = await API.get("/notifications"); setNotifs(apiItems(r)); } catch (error) { console.error("Failed to load notifications:", error.response?.data || error.message); setNotifs([]); } finally { setLoading(false); } };

  const isRead = (notification) => Boolean(notification.read || notification.readAt);
  const canApproveProfileRequest = ["owner", "admin", "manager"].includes(user?.role);
  const canApproveProductDeletion = ["owner", "admin"].includes(user?.role);
  const requestIdOf = (notification) => notification?.data?.requestId;

  const markRead = async id => {

    try { await API.patch(`/notifications/${id}/read`); setNotifs(p=>p.map(n=>(n._id===id||n.id===id)?{...n,read:true,readAt:new Date().toISOString()}:n)); notifyNotificationsChanged(); }

    catch { toast.error("Failed"); }

  };

  const markAll = async () => {

    try { await API.patch("/notifications/read-all"); setNotifs(p=>p.map(n=>({...n,read:true,readAt:new Date().toISOString()}))); notifyNotificationsChanged(); toast.success("All marked as read"); }

    catch { toast.error("Failed"); }

  };

  const clearOne = async (notification) => {
    const id = notification._id || notification.id;
    try {
      await API.delete(`/notifications/${id}`);
      setNotifs((prev) => prev.filter((item) => (item._id || item.id) !== id));
      notifyNotificationsChanged();
      toast.success("Notification cleared");
    } catch {
      toast.error("Failed to clear notification");
    }
  };

  const clearAll = async () => {
    try {
      await API.delete("/notifications/clear-all");
      setNotifs([]);
      notifyNotificationsChanged();
      toast.success("Notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const decideRequest = async (notification, decision) => {
    const requestId = requestIdOf(notification);
    if (!requestId) return;
    const action = notification?.data?.action;
    const endpoint =
      action === "product_delete_request"
        ? `/products/deletion-requests/${requestId}/${decision}`
        : `/users/profile-change-requests/${requestId}/${decision}`;

    try {
      await API.post(endpoint);
      setNotifs((prev) =>
        prev.map((item) =>
          (item._id || item.id) === (notification._id || notification.id)
            ? { ...item, read: true, readAt: new Date().toISOString(), data: { ...item.data, status: decision === "approve" ? "approved" : "declined" } }
            : item
        )
      );
      notifyNotificationsChanged();
      toast.success(decision === "approve" ? "Request approved" : "Request declined");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update request");
    }
  };



  const filtered = tab==="all" ? notifs : notifs.filter(n=>n.type===tab);

  const unread   = notifs.filter(n=>!isRead(n)).length;



  if (loading) return <LoadingSpinner text="Loading notifications…"/>;

  return (

    <div className="page-enter">

      <PageHeader eyebrow="Inbox" title="Notifications"

        subtitle={unread>0?`${unread} unread notification${unread!==1?"s":""}` : "You're all caught up!"} action={

          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {unread>0&&<button className="btn-ghost" onClick={markAll}><CheckCheck size={15}/>Mark All Read</button>}
            {notifs.length>0&&<button className="btn-ghost" onClick={clearAll} style={{color:"#dc2626"}}><X size={15}/>Clear All</button>}
          </div>

        }/>

      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"20px"}}>

        {TABS.map(t=>(

          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"6px 16px",borderRadius:"100px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:"1.5px solid",transition:"all var(--t)",background:tab===t.k?"var(--emerald)":"var(--surface)",color:tab===t.k?"white":"var(--text-3)",borderColor:tab===t.k?"var(--emerald)":"var(--border)"}}>

            {t.label}

          </button>

        ))}

      </div>



      {filtered.length===0 ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here."/> : (

        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>

          {filtered.map(n=>{

            const Icon = TICON[n.type]||Bell;
            const read = isRead(n);
            const isProfileRequest = n?.data?.action === "profile_change_request";
            const isProductDeleteRequest = n?.data?.action === "product_delete_request";
            const canActOnRequest = (isProfileRequest && canApproveProfileRequest) || (isProductDeleteRequest && canApproveProductDeletion);
            const requestStatus = n?.data?.status;

            return(

              <div key={n._id||n.id} onClick={()=>!read&&markRead(n._id||n.id)} style={{

                display:"flex",alignItems:"flex-start",gap:"14px",padding:"16px 20px",

                background:read?"var(--surface)":"rgba(37,99,235,0.04)",

                borderRadius:"var(--r-lg)",

                border:`1.5px solid ${read?"var(--border)":"rgba(37,99,235,0.18)"}`,

                boxShadow:read?"var(--shadow-xs)":"var(--shadow-sm)",

                cursor:read?"default":"pointer",transition:"all var(--t)",

              }}

              onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--shadow-md)"}

              onMouseLeave={e=>e.currentTarget.style.boxShadow=read?"var(--shadow-xs)":"var(--shadow-sm)"}>

                <div style={{ width:"38px",height:"38px",borderRadius:"11px",background:TBG[n.type]||"var(--surface-3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>

                  <Icon size={17} style={{color:TCOLOR[n.type]||"var(--text-muted)"}}/>

                </div>

                <div style={{flex:1,minWidth:0}}>

                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"8px"}}>

                    <p style={{fontSize:"14px",fontWeight:read?400:600,color:"var(--text)",lineHeight:1.45}}>{n.message||n.title||"Notification"}</p>

                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                      {!read&&<span style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--emerald)",flexShrink:0}} className="pulse-live"/>}
                      <button type="button" aria-label="Clear notification" onClick={(event)=>{event.stopPropagation();clearOne(n);}} style={{width:"26px",height:"26px",borderRadius:"8px",border:"1px solid var(--border)",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text-muted)"}}>
                        <X size={14}/>
                      </button>
                    </div>

                  </div>

                  {n.createdAt&&<p style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px",display:"flex",alignItems:"center",gap:"4px"}}><Clock size={11}/>{new Date(n.createdAt).toLocaleString("en-IN")}</p>}
                  {(isProfileRequest || isProductDeleteRequest) && canActOnRequest && (
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"12px",flexWrap:"wrap"}} onClick={(event)=>event.stopPropagation()}>
                      {requestStatus ? (
                        <span style={{fontSize:"12px",fontWeight:700,color:requestStatus==="approved"?"var(--emerald)":"#dc2626",textTransform:"capitalize"}}>{requestStatus}</span>
                      ) : (
                        <>
                          <button type="button" className="btn-primary" style={{padding:"7px 12px",fontSize:"12px"}} onClick={()=>decideRequest(n, "approve")}><Check size={14}/>Accept</button>
                          <button type="button" className="btn-ghost" style={{padding:"7px 12px",fontSize:"12px",color:"#dc2626"}} onClick={()=>decideRequest(n, "decline")}><X size={14}/>Decline</button>
                        </>
                      )}
                    </div>
                  )}

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}

