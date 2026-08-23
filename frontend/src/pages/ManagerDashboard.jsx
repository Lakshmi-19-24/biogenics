import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import StatsCard from "../components/ui/StatsCard";

import DataTable from "../components/ui/DataTable";

import EmptyState from "../components/ui/EmptyState";

import LoadingSpinner from "../components/ui/LoadingSpinner";

import PageHeader from "../components/ui/PageHeader";

import { Users, ShoppingCart, Target, TrendingUp, Trash2 } from "lucide-react";
import { fetchDashboard } from "../store/slices/dashboardSlice";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import API from "../services/api";
import toast from "react-hot-toast";

const CS = { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"12px", color:"var(--text)", fontSize:"12px" };

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [performanceData] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const dispatch = useDispatch();

  useEffect(()=>{
    (async()=>{
      try{
        const data=await dispatch(fetchDashboard()).unwrap();
        setStats({teamSize:data.stats.teamSize,leadsAssigned:data.stats.leads,ordersClosed:data.stats.orders,teamRevenue:data.stats.revenue});
      }catch{} finally{setLoading(false);} 
    })();
  },[dispatch]);

  useEffect(() => {
    loadTeamUsers();
  }, []);

  const loadTeamUsers = async () => {
    try {
      const response = await API.get('/users');
      const users = Array.isArray(response?.data) ? response.data : response?.data?.items || [];
      setTeamActivity(users);
    } catch {
      toast.error('Failed to load team members');
    }
  };

  const deleteSalesPerson = async (user) => {
    if (!window.confirm(`Delete ${user.name || 'this sales person'}?`)) return;

    setDeletingUserId(user._id);
    try {
      await API.delete(`/users/${user._id}`);
      toast.success('Sales person deleted successfully');
      loadTeamUsers();
    } catch {
      toast.error('Failed to delete sales person');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard…"/>;

  const cols = [

    { header:"Name", accessor:"name", render:r=><span style={{fontWeight:600}}>{r.name||"—"}</span> },

    { header:"Leads", accessor:"leads" },

    { header:"Orders", accessor:"orders" },

    { header:"Revenue", accessor:"revenue" },

    { header:"Target %", accessor:"targetPercent", render:r=>{

      const p=Number(r.targetPercent||0);

      return <div style={{display:"flex",alignItems:"center",gap:"8px"}}>

        <div style={{flex:1,height:"6px",borderRadius:"99px",background:"var(--border)",overflow:"hidden"}}>

          <div style={{height:"100%",borderRadius:"99px",width:`${Math.min(p,100)}%`,background:p>=80?"var(--emerald)":p>=50?"var(--warning)":"var(--danger)"}}/>

        </div>

        <span style={{fontSize:"12px",fontWeight:600,color:"var(--text-3)",minWidth:"36px"}}>{p}%</span>

      </div>;

    }},
    { header:"Actions", render:r=>(
      <button
        onClick={() => deleteSalesPerson(r)}
        disabled={deletingUserId === r._id}
        style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 10px",fontSize:"12px",borderRadius:"8px",border:"1px solid rgba(239,68,68,0.35)",background:"transparent",color:"#f87171",cursor:"pointer"}}
      >
        <Trash2 size={14} /> {deletingUserId === r._id ? "Deleting…" : "Delete"}
      </button>
    )},

  ];

  return (

    <div className="page-enter">

      <PageHeader eyebrow="Manager" title="Dashboard" subtitle="Your team's performance at a glance"/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"24px"}} className="stagger">

        <StatsCard icon={Users} label="Team Members" value={stats?.teamSize||"0"} color="primary"/>

        <StatsCard icon={Target} label="Leads Assigned" value={stats?.leadsAssigned||"0"} trend={stats?.leadsTrend} trendLabel="this week" color="warning"/>

        <StatsCard icon={ShoppingCart} label="Orders Closed" value={stats?.ordersClosed||"0"} trend={stats?.ordersTrend} trendLabel="this week" color="success"/>

        <StatsCard icon={TrendingUp} label="Team Revenue" value={stats?.teamRevenue||"₹0"} trend={stats?.revenueTrend} trendLabel="vs target" color="info"/>

      </div>

      <div className="card" style={{padding:"24px",marginBottom:"24px"}}>

        <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em",marginBottom:"4px"}}>Target vs Achievement</p>

        <p style={{fontSize:"12px",color:"var(--text-muted)",marginBottom:"20px"}}>Per team member comparison</p>

        {performanceData.length>0?(

          <ResponsiveContainer width="100%" height={260}>

            <BarChart data={performanceData} barSize={24} margin={{top:4,right:4,bottom:0,left:-20}}>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>

              <XAxis dataKey="member" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}/>

              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}/>

              <Tooltip contentStyle={CS}/>

              <Bar dataKey="target" fill="rgba(37,99,235,0.15)" radius={[4,4,0,0]} name="Target"/>

              <Bar dataKey="achieved" fill="#2563EB" radius={[4,4,0,0]} name="Achieved"/>

            </BarChart>

          </ResponsiveContainer>

        ):(

          <EmptyState icon={TrendingUp} title="No performance data" description="Data appears once team activity is tracked."/>

        )}

      </div>

      <div className="card" style={{overflow:"hidden"}}>

        <div className="card-header"><p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em"}}>Team Activity</p></div>

        <DataTable columns={cols} data={teamActivity} pageSize={10} emptyMessage="No team activity data yet."/>

      </div>

    </div>

  );

}

