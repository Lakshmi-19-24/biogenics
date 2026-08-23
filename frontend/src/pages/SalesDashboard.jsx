import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import StatsCard from "../components/ui/StatsCard";

import EmptyState from "../components/ui/EmptyState";

import LoadingSpinner from "../components/ui/LoadingSpinner";

import PageHeader from "../components/ui/PageHeader";

import { Users, ShoppingCart, MapPin, ClipboardList, Target, Clock, ArrowRight } from "lucide-react";
import { fetchDashboard } from "../store/slices/dashboardSlice";
export default function SalesDashboard() {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [stats, setStats] = useState(null);
  const [todaySchedule] = useState([]);

  const [loading, setLoading] = useState(true);
  useEffect(()=>{ (async()=>{ try{ const data=await dispatch(fetchDashboard()).unwrap(); setStats({myLeads:data.stats.leads,myOrders:data.stats.orders,todayVisits:data.stats.visits,dcrStatus:data.stats.attendanceToday ? "Submitted" : "Pending"}); }catch{} finally{setLoading(false);} })(); },[dispatch]);
  if (loading) return <LoadingSpinner text="Loading dashboard…"/>;

  const actions = [

    { label:"Add Lead",    icon:Users,          path:"/leads",      gradient:"linear-gradient(135deg,#2563EB,#3B82F6)" },

    { label:"New Order",   icon:ShoppingCart,   path:"/orders",     gradient:"linear-gradient(135deg,#0369a1,#0ea5e9)" },

    { label:"Check In",    icon:MapPin,         path:"/attendance", gradient:"linear-gradient(135deg,#d97706,#fbbf24)" },

    { label:"Log Activity",icon:ClipboardList,  path:"/activity",   gradient:"linear-gradient(135deg,#7c3aed,#a78bfa)" },

  ];

  return (

    <div className="page-enter">

      <PageHeader eyebrow="Sales Executive" title="My Dashboard" subtitle="Your daily overview and quick actions"/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"24px"}} className="stagger">

        <StatsCard icon={Users} label="My Leads" value={stats?.myLeads||"0"} trend={stats?.leadsTrend} trendLabel="this week" color="primary"/>

        <StatsCard icon={ShoppingCart} label="My Orders" value={stats?.myOrders||"0"} trend={stats?.ordersTrend} trendLabel="this week" color="success"/>

        <StatsCard icon={MapPin} label="Today's Visits" value={stats?.todayVisits||"0"} color="warning"/>

        <StatsCard icon={Target} label="DCR Status" value={stats?.dcrStatus||"Pending"} color="info"/>

      </div>

      <div style={{marginBottom:"24px"}}>

        <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em",marginBottom:"14px"}}>Quick Actions</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"14px"}}>

          {actions.map(a=>(

            <button key={a.label} onClick={()=>navigate(a.path)} style={{ padding:"20px",borderRadius:"var(--r-xl)",background:a.gradient,border:"none",cursor:"pointer",textAlign:"left",color:"white",display:"flex",flexDirection:"column",gap:"12px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"transform var(--t-spring),box-shadow var(--t)",position:"relative",overflow:"hidden" }}

              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.22)"; }}

              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.15)"; }}>

              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"80px",height:"80px",borderRadius:"50%",background:"rgba(255,255,255,0.10)"}}/>

              <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>

                <a.icon size={20} color="white"/>

              </div>

              <div>

                <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:"15px",letterSpacing:"-0.02em"}}>{a.label}</p>

                <div style={{display:"flex",alignItems:"center",gap:"4px",color:"rgba(255,255,255,0.6)",fontSize:"12px",marginTop:"2px"}}>Tap to open <ArrowRight size={11}/></div>

              </div>

            </button>

          ))}

        </div>

      </div>

      <div className="card" style={{overflow:"hidden"}}>

        <div className="card-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>

          <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em"}}>Today's Schedule</p>

          <button onClick={()=>navigate("/activity")} style={{display:"flex",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",color:"var(--emerald)",fontSize:"13px",fontWeight:600}}>

            View All <ArrowRight size={13}/>

          </button>

        </div>

        {todaySchedule.length>0?(

          <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>

            {todaySchedule.map((item,i)=>(

              <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 16px",borderRadius:"var(--r)",background:"var(--surface-2)",border:"1px solid var(--border)"}}>

                <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"var(--emerald-dim)",display:"flex",alignItems:"center",justifyContent:"center"}}><MapPin size={16} style={{color:"var(--emerald)"}}/></div>

                <div style={{flex:1}}>

                  <p style={{fontSize:"13px",fontWeight:600,color:"var(--text)"}}>{item.title}</p>

                  <p style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"2px"}}><Clock size={11} style={{display:"inline",marginRight:"4px"}}/>{item.time} · {item.location}</p>

                </div>

              </div>

            ))}

          </div>

        ):(

          <EmptyState icon={ClipboardList} title="No activities scheduled" description="Log an activity to see it here." action={()=>navigate("/activity")} actionLabel="Log Activity"/>

        )}

      </div>

    </div>

  );

}

