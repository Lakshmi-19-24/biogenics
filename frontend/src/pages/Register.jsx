import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, ChevronDown } from "lucide-react";
import FormField from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";
import AnimatedLogo from "../components/AnimatedLogo";

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [form,    setForm]    = useState({ name:"", email:"", password:"", role:"sales" });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) { toast.error("Fill all fields"); return; }
    if (form.password.length<8) { toast.error("Password min 8 characters"); return; }
    setLoading(true);
    try { await API.post("/auth/register", form); toast.success("Account created!"); goHome(); }
    catch (err) { toast.error(err.response?.data?.message||"Registration failed"); }
    finally { setLoading(false); }
  };

  const goHome = () => {
    const role = user?.role;
    if (role === "owner") navigate("/owner");
    else if (role === "admin") navigate("/admin");
    else if (role === "manager") navigate("/manager");
    else navigate("/sales");
  };

  const IS = { width:"100%",fontFamily:"Be Vietnam Pro,sans-serif",fontSize:"14px",color:"var(--text)",background:"var(--surface-2)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"11px 14px",outline:"none" };
  const fb = e => { e.target.style.borderColor="var(--emerald)"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; e.target.style.background="var(--bg)"; };
  const bb = e => { e.target.style.borderColor="var(--border)"; e.target.style.boxShadow="none"; e.target.style.background="var(--surface-2)"; };

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:"32px 24px" }}>
      <div style={{ width:"100%",maxWidth:"430px" }} className="anim-fade-up">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",marginBottom:"28px" }}>
          <AnimatedLogo size={48} showText={false} />
          <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:"17px",color:"var(--text)",letterSpacing:"-0.03em",margin: 0 }}>Bio-Genics Lifecare</p>
        </div>
        <div style={{ textAlign:"center",marginBottom:"24px" }}>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"27px",fontWeight:800,color:"var(--text)",letterSpacing:"-0.04em",marginBottom:"6px" }}>Create your account</h2>
          <p style={{ color:"var(--text-muted)",fontSize:"14px" }}>Join your team on the platform</p>
        </div>
        <div style={{ background:"var(--surface)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)",boxShadow:"var(--shadow-lg)",padding:"28px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display:"flex",flexDirection:"column",gap:"16px",marginBottom:"20px" }}>
              <FormField label="Full Name"><input type="text" value={form.name} placeholder="John Doe" onChange={e=>setForm({...form,name:e.target.value})} style={IS} onFocus={fb} onBlur={bb}/></FormField>
              <FormField label="Email Address"><input type="email" value={form.email} placeholder="you@company.com" onChange={e=>setForm({...form,email:e.target.value})} style={IS} onFocus={fb} onBlur={bb}/></FormField>
              <FormField label="Password">
                <div style={{position:"relative"}}>
                  <input type={showPw?"text":"password"} value={form.password} placeholder="Min. 6 characters" onChange={e=>setForm({...form,password:e.target.value})} style={{...IS,paddingRight:"44px"}} onFocus={fb} onBlur={bb}/>
                  <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:"13px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}>
                    {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </FormField>
              <FormField label="Role">
                <div style={{position:"relative"}}>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{...IS,cursor:"pointer",paddingRight:"36px",appearance:"none"}} onFocus={fb} onBlur={bb}>
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="sales">Sales Executive</option>
                  </select>
                  <ChevronDown size={14} style={{position:"absolute",right:"13px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
                </div>
              </FormField>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:"15px"}}>
              {loading?<div style={{width:"18px",height:"18px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#F1F5F9"}} className="anim-spin"/>:<><span>Create Account</span><ArrowRight size={17}/></>}
            </button>
          </form>
          <div style={{marginTop:"18px",textAlign:"center",paddingTop:"18px",borderTop:"1px solid var(--border)"}}>
            <p style={{fontSize:"13px",color:"var(--text-muted)"}}>
              Done?{" "}
              <button type="button" onClick={goHome} style={{ color:"var(--emerald)",fontWeight:700,textDecoration:"none",background:"none",border:"none",cursor:"pointer" }}>
                Go to dashboard
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
