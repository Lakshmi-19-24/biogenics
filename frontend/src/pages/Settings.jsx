import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API, { apiErrorMessage } from "../services/api";
import { User, Mail, Lock, Save, Shield, Eye, EyeOff, Zap } from "lucide-react";
import FormField from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";

const IS = { width:"100%",fontFamily:"Be Vietnam Pro,sans-serif",fontSize:"14px",color:"var(--text)",background:"var(--surface-2)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 14px",outline:"none" };
const ISL= { ...IS, paddingLeft:"40px" };
const fb = e => { e.target.style.borderColor="var(--emerald)"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; };
const bb = e => { e.target.style.borderColor="var(--border)"; e.target.style.boxShadow="none"; };
const RL = { owner:"Owner", admin:"Administrator", manager:"Manager", sales:"Sales Executive" };
const RC = { owner:"#7c3aed", admin:"#2563EB", manager:"#0369a1", sales:"#d97706" };

export default function Settings() {
  const { user } = useAuth();

  const [pf, setPf] = useState({ name:user?.name||"", email:user?.email||"", phone:user?.phone||"", branch:user?.branch||"", territory:user?.territory||"" });
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [saving, setSaving] = useState(false);
  const [show,   setShow]   = useState({ cur:false,nw:false,cf:false });
  const profileRequiresApproval = user?.role === "sales";
  const passwordRequiresApproval = user?.role !== "owner";

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await API.get("/users/profile/me");
        setPf({ 
          name: res.data.data?.name || "", 
          email: res.data.data?.email || "",
          phone: res.data.data?.phone || "",
          branch: res.data.data?.branch || "",
          territory: res.data.data?.territory || ""
        });
      } catch (error) {
        toast.error(apiErrorMessage(error, "Failed to load profile"));
      }
    };

    loadMe();
  }, []);

  const saveProfile = async e => {
    e.preventDefault();
    if (!pf.name) { toast.error("Name required"); return; }
    setSaving(true);
    try { 
      const updateData = { name: pf.name, phone: pf.phone, branch: pf.branch, territory: pf.territory };
      await API.patch("/users/profile/me", updateData); 
      toast.success(profileRequiresApproval ? "Profile change request sent for approval!" : "Profile updated!"); 
    }
    catch (error) { toast.error(apiErrorMessage(error, "Failed to update profile")); }
    finally { setSaving(false); }
  };

  const savePw = async e => {
    e.preventDefault();
    if (!pw.currentPassword||!pw.newPassword) { toast.error("Fill all password fields"); return; }
    if (pw.newPassword!==pw.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (pw.newPassword.length<8) { toast.error("Min 8 characters"); return; }
    setSaving(true);
    try { await API.post("/users/profile/change-password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success(passwordRequiresApproval ? "Password change request sent for approval!" : "Password changed!"); setPw({currentPassword:"",newPassword:"",confirmPassword:""}); }
    catch (error) { toast.error(apiErrorMessage(error, "Failed to change password")); }
    finally { setSaving(false); }
  };

  const initials = (user?.name||"U").slice(0,2).toUpperCase();

  return (
    <div className="page-enter" style={{ maxWidth:"640px" }}>
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile and security"/>
      {(profileRequiresApproval || passwordRequiresApproval) && (
        <div style={{padding:"12px 16px",border:"1px solid rgba(217,119,6,0.25)",background:"rgba(217,119,6,0.08)",borderRadius:"var(--r-lg)",marginBottom:"16px",fontSize:"13px",fontWeight:600,color:"#92400e"}}>
          {user?.role === "sales"
            ? "Profile and password changes need approval from an owner, admin, or manager before they are applied."
            : "Password changes need owner approval before they are applied."}
        </div>
      )}

      {/* Profile hero card */}
      <div style={{ borderRadius:"var(--r-xl)",padding:"24px",marginBottom:"20px",background:"linear-gradient(135deg,rgba(8,16,40,0.95) 0%,rgba(15,28,53,0.92) 100%)",border:"1px solid rgba(59,130,246,0.15)",boxShadow:"0 0 30px rgba(37,99,235,0.08),inset 0 1px 0 rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",gap:"18px",position:"relative",overflow:"hidden" }}>
        {/* Decorative gradient glow */}
        <div style={{position:"absolute",top:"-50%",right:"-50%",width:"400px",height:"400px",background:"radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
        
        <div style={{ width:"64px",height:"64px",borderRadius:"18px",background:`linear-gradient(135deg,${RC[user?.role]||"#2563EB"},rgba(59,130,246,0.85))`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"24px",fontWeight:800,flexShrink:0,fontFamily:"'Bricolage Grotesque',sans-serif",boxShadow:"0 0 20px rgba(37,99,235,0.4),var(--shadow-primary-sm)",border:"1px solid rgba(96,165,250,0.2)",position:"relative",zIndex:1 }}>
          {initials}
        </div>
        <div style={{flex:1,position:"relative",zIndex:1}}>
          <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"18px",fontWeight:800,color:"#F8FAFC",letterSpacing:"-0.03em"}}>{user?.name||"User"}</p>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"6px"}}>
            <Shield size={13} style={{color:"#60A5FA"}}/>
            <span style={{fontSize:"13px",color:"#CBD5E1",fontWeight:600}}>{RL[user?.role]||"User"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",flexShrink:0,position:"relative",zIndex:1,boxShadow:"0 0 15px rgba(16,185,129,0.15)"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#10B981",boxShadow:"0 0 10px rgba(16,185,129,0.6)",animation:"pulse-dot 2s ease-in-out infinite"}}/>
          <span style={{fontSize:"12px",fontWeight:600,color:"#6EE7B7"}}>Active</span>
        </div>
      </div>

      {/* Profile form */}
      <div style={{background:"var(--surface)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",overflow:"hidden",marginBottom:"16px"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
          <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"15px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.02em"}}>Profile Information</p>
        </div>
        <form onSubmit={saveProfile} style={{padding:"22px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"20px"}}>
            <FormField label="Full Name">
              <div style={{position:"relative"}}>
                <User size={14} style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
                <input type="text" value={pf.name} placeholder="Your name" onChange={e=>setPf({...pf,name:e.target.value})} style={ISL} onFocus={fb} onBlur={bb}/>
              </div>
            </FormField>
            <FormField label="Email Address">
              <div style={{position:"relative"}}>
                <Mail size={14} style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
                <input type="email" value={pf.email} placeholder="your@email.com" readOnly style={ISL} />
              </div>
            </FormField>
            <FormField label="Phone Number">
              <div style={{position:"relative"}}>
                <input type="tel" value={pf.phone} placeholder="Your phone number" onChange={e=>setPf({...pf,phone:e.target.value})} style={IS} onFocus={fb} onBlur={bb}/>
              </div>
            </FormField>
            <FormField label="Branch">
              <div style={{position:"relative"}}>
                <input type="text" value={pf.branch} placeholder="Your branch" onChange={e=>setPf({...pf,branch:e.target.value})} style={IS} onFocus={fb} onBlur={bb}/>
              </div>
            </FormField>
            <FormField label="Territory">
              <div style={{position:"relative"}}>
                <input type="text" value={pf.territory} placeholder="Your territory" onChange={e=>setPf({...pf,territory:e.target.value})} style={IS} onFocus={fb} onBlur={bb}/>
              </div>
            </FormField>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={15}/>{saving?"Saving...":profileRequiresApproval?"Request Changes":"Save Changes"}</button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div style={{background:"var(--surface)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
          <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"15px",fontWeight:700,color:"var(--text)",letterSpacing:"-0.02em"}}>Change Password</p>
        </div>
        <form onSubmit={savePw} style={{padding:"22px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"20px"}}>
            {[{l:"Current Password",f:"currentPassword",k:"cur"},{l:"New Password",f:"newPassword",k:"nw"},{l:"Confirm Password",f:"confirmPassword",k:"cf"}].map(({l,f,k})=>(
              <FormField key={f} label={l}>
                <div style={{position:"relative"}}>
                  <Lock size={14} style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
                  <input type={show[k]?"text":"password"} value={pw[f]} placeholder="********" onChange={e=>setPw({...pw,[f]:e.target.value})} style={{...ISL,paddingRight:"44px"}} onFocus={fb} onBlur={bb}/>
                  <button type="button" onClick={()=>setShow({...show,[k]:!show[k]})} style={{position:"absolute",right:"13px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}>
                    {show[k]?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </FormField>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={15}/>{saving?"Saving...":passwordRequiresApproval?"Request Password Change":"Update Password"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
