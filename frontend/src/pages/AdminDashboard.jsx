import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import StatsCard from "../components/ui/StatsCard";
import DataTable from "../components/ui/DataTable";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatusBadge from "../components/ui/StatusBadge";
import PageHeader from "../components/ui/PageHeader";
import { fetchDashboard } from "../store/slices/dashboardSlice";
import { DollarSign, ShoppingCart, Users, UserCheck, TrendingUp, ArrowUpRight, Activity, Edit, User, Plus, UserPlus, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/ui/Modal";
import FormField from "../components/ui/FormField";



const CS = { background:"#111827", border:"1px solid var(--border)", borderRadius:"12px", color:"var(--text)", fontSize:"12px", boxShadow:"var(--shadow-md)" };

const attendanceAccessLabel = (row) => (row.isAttendanceActive ? "Active" : "Inactive");
const attendanceStatusLabel = (row) => {
  const status = String(row.attendanceStatus || "absent").replace(/_/g, " ");
  return status.replace(/\b\w/g, (letter) => letter.toUpperCase()).replace("Half Day", "Half-day");
};



export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [leadData, setLeadData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', branch: '', territory: '', email: '', password: '', managerId: '' });
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { loadDashboard(); loadUsers(); }, []);

  const loadDashboard = async () => {
    try {
      const data = await dispatch(fetchDashboard()).unwrap();
      setStats(data.stats);
      setRevenueData(data.revenue || []);
      setLeadData(data.leads || []);
      setRecentOrders(data.recentOrders || []);
    } catch {}
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const response = await API.get('/users');
      setUsers(response.data || []);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const canEditUser = (user) => {
    // Admin can edit manager and sales executive, but not self
    if (!currentUser?.rawUser?._id) return false;
    return (user.role === 'manager' || user.role === 'sales') && user._id !== currentUser.rawUser._id;
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      branch: user.branch || '',
      territory: user.territory || '',
      email: user.email || '',
      password: '',
      managerId: user.manager || ''
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updateData = {
        name: editForm.name,
        phone: editForm.phone,
        branch: editForm.branch,
        territory: editForm.territory,
        email: editForm.email,
        manager: editForm.managerId
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      await API.patch(`/users/${editingUser._id}`, updateData);
      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers(); // Refresh list
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <LoadingSpinner text="Loading dashboard…" />;



  const orderCols = [

    { header:"Order", accessor:"orderId", render:r=><span className="font-mono" style={{ fontSize:"12px",fontWeight:600,background:"var(--emerald-dim)",color:"var(--emerald)",padding:"3px 8px",borderRadius:"6px" }}>#{r.orderId||r._id?.slice(-6)||"—"}</span> },

    { header:"Customer", accessor:"customer", render:r=><span style={{ fontWeight:600,fontSize:"13px" }}>{r.customer||"—"}</span> },

    { header:"Amount", accessor:"totalAmount", render:r=><span style={{ fontWeight:700 }}>₹{Number(r.totalAmount||0).toLocaleString()}</span> },

    { header:"Status", accessor:"status", render:r=><StatusBadge status={r.status}/> },

    { header:"Date", accessor:"createdAt", render:r=><span style={{ fontSize:"12px",color:"var(--text-muted)" }}>{r.createdAt?new Date(r.createdAt).toLocaleDateString("en-IN"):"—"}</span> },

  ];



  const today = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const chartData = revenueData.length ? revenueData : ["Jan","Feb","Mar","Apr","May","Jun"].map(month => ({ month, revenue: 0 }));
  const pipeline = ["New","Contacted","Qualified","Converted","Lost"].map(stage => {
    const found = leadData.find(item => String(item.stage || item.status || "").toLowerCase() === stage.toLowerCase());
    return { stage, count: Number(found?.count || 0) };
  });
  const maxPipeline = Math.max(1, ...pipeline.map(item => item.count));
  const quickActions = [
    { label:"Add Lead", icon:Plus, path:"/leads" },
    { label:"Create Order", icon:ShoppingCart, path:"/orders" },
    { label:"Add Customer", icon:UserPlus, path:"/customers" },
    { label:"View Reports", icon:BarChart3, path:"/reports" },
  ];



  return (

    <div className="page-enter">

      <PageHeader eyebrow="Admin" title="Dashboard" subtitle={today} action={

        <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 14px",background:"var(--emerald-dim)",border:"1px solid var(--emerald-border)",borderRadius:"10px" }}>

          <span className="pulse-live"/>

          <span style={{ fontSize:"13px",fontWeight:600,color:"var(--emerald)" }}>Live</span>

        </div>

      }/>



      {/* Stats */}

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"24px" }} className="stagger">

        <StatsCard icon={DollarSign} label="Total Revenue" value={stats?.revenue||"₹0"} trend={stats?.revenueTrend} trendLabel="vs last month" color="success" className="anim-fade-up"/>

        <StatsCard icon={ShoppingCart} label="Total Orders" value={stats?.orders||"0"} trend={stats?.ordersTrend} trendLabel="vs last month" color="info" className="anim-fade-up"/>

        <StatsCard icon={Users} label="Active Leads" value={stats?.leads||"0"} trend={stats?.leadsTrend} trendLabel="vs last month" color="warning" className="anim-fade-up"/>

        <StatsCard icon={UserCheck} label="Team Members" value={stats?.teamSize||"0"} color="primary" className="anim-fade-up"/>

      </div>



      {/* Charts */}

      <div style={{ display:"grid",gridTemplateColumns:"minmax(0,3fr) minmax(320px,2fr)",gap:"16px",marginBottom:"18px" }}>

        <div className="card" style={{ padding:"20px" }}>

          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"20px" }}>

            <div>

              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em" }}>Revenue Overview</p>

              <p style={{ fontSize:"12px",color:"var(--text-muted)",marginTop:"2px" }}>Monthly revenue trend</p>

            </div>

            <div style={{ display:"flex",alignItems:"center",gap:"6px",padding:"5px 10px",background:"rgba(37,99,235,0.10)",borderRadius:"8px" }}>

              <ArrowUpRight size={13} style={{ color:"var(--emerald)" }}/>

              <span style={{ fontSize:"12px",fontWeight:700,color:"var(--emerald)" }}>+12%</span>

            </div>

          </div>

            <ResponsiveContainer width="100%" height={250}>

              <AreaChart data={chartData} margin={{top:4,right:8,bottom:0,left:-12}}>

                <defs>

                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">

                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>

                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>

                  </linearGradient>

                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>

                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}/>

                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}/>

                <Tooltip contentStyle={CS}/>

                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#rg)" strokeWidth={2.5} dot={{r:4,fill:"#2563EB",strokeWidth:0}} activeDot={{r:6}}/>

              </AreaChart>

            </ResponsiveContainer>

        </div>



        <div className="card" style={{ padding:"20px" }}>

          <div style={{ marginBottom:"20px" }}>

            <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em" }}>Lead Pipeline</p>

            <p style={{ fontSize:"12px",color:"var(--text-muted)",marginTop:"2px" }}>By stage distribution</p>

          </div>

          <div style={{ display:"grid", gap:"14px" }}>
            {pipeline.map(item => (
              <div key={item.stage}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"7px" }}>
                  <span style={{ fontSize:"13px", color:"var(--text-2)", fontWeight:600 }}>{item.stage}</span>
                  <span style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>{item.count}</span>
                </div>
                <div style={{ height:"8px", borderRadius:"999px", background:"#1E293B", overflow:"hidden" }}>
                  <div style={{ width:`${(item.count / maxPipeline) * 100}%`, height:"100%", borderRadius:"999px", background:item.stage==="Lost"?"#EF4444":item.stage==="Converted"?"#10B981":item.stage==="Qualified"?"#F59E0B":"#2563EB", boxShadow:"0 0 16px rgba(37,99,235,0.35)" }} />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:"14px", marginBottom:"24px" }}>
        {quickActions.map(({ label, icon:Icon, path }) => (
          <button key={label} onClick={() => navigate(path)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px", borderRadius:"14px", background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)", cursor:"pointer", boxShadow:"var(--shadow-sm)", transition:"all var(--t)" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(37,99,235,0.45)"; e.currentTarget.style.boxShadow="var(--shadow-emerald-sm)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; }}>
            <span style={{ width:"36px", height:"36px", borderRadius:"10px", background:"rgba(37,99,235,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={18} color="#60A5FA" /></span>
            <span style={{ fontSize:"14px", fontWeight:700 }}>{label}</span>
          </button>
        ))}
      </div>



      {/* Recent orders */}

      <div className="card" style={{ overflow:"hidden" }}>

        <div className="card-header" style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>

          <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em" }}>Recent Orders</p>

          <Activity size={16} style={{ color:"var(--text-muted)" }}/>

        </div>

        <DataTable columns={orderCols} data={recentOrders} pageSize={5} searchable={false} emptyTitle="No orders yet" emptyMessage="Create the first order to populate this activity stream." emptyAction={() => navigate("/orders")} emptyActionLabel="Create First Order"/>

      </div>

      {/* User Management */}
      <div className="card" style={{ overflow:"hidden", marginTop:"24px" }}>
        <div className="card-header" style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"16px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.03em" }}>User Management</p>
          <User size={16} style={{ color:"var(--text-muted)" }}/>
        </div>
        <DataTable 
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Role', render: (row) => <StatusBadge status={row.role} /> },
            { header: 'Today', accessor: 'attendanceStatus', render: (row) => <StatusBadge status={attendanceStatusLabel(row)} /> },
            { header: 'Status', accessor: 'isAttendanceActive', render: (row) => <StatusBadge status={attendanceAccessLabel(row)} /> },
            { header: 'Actions', render: (row) => 
              canEditUser(row) ? (
                <button onClick={() => startEdit(row)} className="btn-secondary" style={{ padding:"6px 12px", fontSize:"12px" }}>
                  <Edit size={14} /> Edit
                </button>
              ) : null
            }
          ]} 
          data={users} 
          searchable={true} 
          emptyMessage="No users found."
        />
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        <div style={{ padding:"20px" }}>
          <FormField label="Name">
            <input 
              type="text" 
              value={editForm.name} 
              onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <FormField label="Email">
            <input 
              type="email" 
              value={editForm.email} 
              onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <FormField label="Phone">
            <input 
              type="tel" 
              value={editForm.phone} 
              onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <FormField label="Branch">
            <input 
              type="text" 
              value={editForm.branch} 
              onChange={(e) => setEditForm({...editForm, branch: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <FormField label="Territory">
            <input 
              type="text" 
              value={editForm.territory} 
              onChange={(e) => setEditForm({...editForm, territory: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <FormField label="Manager Assigned">
            <select 
              value={editForm.managerId} 
              onChange={(e) => setEditForm({...editForm, managerId: e.target.value})} 
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            >
              <option value="">Select Manager</option>
              {users.filter(u => u.role === 'manager').map(manager => (
                <option key={manager._id} value={manager._id}>{manager.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="New Password (leave empty to keep current)">
            <input 
              type="password" 
              value={editForm.password} 
              onChange={(e) => setEditForm({...editForm, password: e.target.value})} 
              placeholder="Enter new password"
              style={{ width:"100%", padding:"10px", border:"1px solid var(--border)", borderRadius:"4px" }}
            />
          </FormField>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"20px" }}>
            <button onClick={() => setEditingUser(null)} className="btn-secondary">Cancel</button>
            <button onClick={saveEdit} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

    </div>

  );

}

