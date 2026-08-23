import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../store/slices/authSlice";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Zap, TrendingUp, Activity } from "lucide-react";
import AnimatedLogo from "../components/AnimatedLogo";
import FeaturePill from "../components/FeaturePill";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const data = await dispatch(loginUser(form)).unwrap();
      toast.success("Welcome back!");
      const role = data.user.role === "sales_executive" ? "sales" : data.user.role;
      if (role === "owner") navigate("/owner");
      else if (role === "admin") navigate("/admin");
      else if (role === "manager") navigate("/manager");
      else navigate("/sales");
    } catch (err) { toast.error(err || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  return (
    <main className="login-page">
      <section className="left-panel">
        <div className="login-form-block">
          <AnimatedLogo size={60} showText={true} className="login-brand" />

          {/* Premium Card Header */}
          <div className="auth-card-header">
            <div className="auth-header-glow" />
            <h1 className="auth-title">Bio-Genics Lifecare</h1>
            <p className="auth-subtitle">Secure access to your pharma sales ecosystem</p>
          </div>

          {/* Auth Form */}
          <form className="login-card" onSubmit={handleSubmit}>
            <div className="login-field">
              <div className="login-input-shell">
                <span className="login-input-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h16v12H4z" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  placeholder="you@company.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="login-field password-field">
              <div className="login-input-shell">
                <span className="login-input-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                    <path d="M6 11h12v9H6z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  placeholder="Password"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="login-password-toggle" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="sign-in-button">
              {loading ? <span className="login-spinner" /> : <span>Sign In</span>}
            </button>

            <p className="access-note">Contact your admin/owner to get access.</p>
          </form>

          {/* Premium Features Grid */}
          <div className="premium-features-grid">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <TrendingUp size={16} />
              </div>
              <span className="feature-label">Real-time tracking</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Zap size={16} />
              </div>
              <span className="feature-label">Smart workflows</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Activity size={16} />
              </div>
              <span className="feature-label">Live analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Lock size={16} />
              </div>
              <span className="feature-label">Enterprise secure</span>
            </div>
          </div>
        </div>
      </section>

      <section className="right-panel" aria-label="Bio-Genics Lifecare healthcare innovation">
        <div className="hero-visual">
          <img src="/images/login-lab.png" className="right-panel-bg" alt="" />
          <div className="right-panel-overlay" />

          {/* Animated particles effect */}
          <div className="particle-field">
            <div className="particle" style={{ delay: "0s", duration: "8s" }} />
            <div className="particle" style={{ delay: "1s", duration: "9s" }} />
            <div className="particle" style={{ delay: "2s", duration: "10s" }} />
            <div className="particle" style={{ delay: "3s", duration: "8s" }} />
            <div className="particle" style={{ delay: "4s", duration: "9.5s" }} />
          </div>

          <div className="ticker" aria-hidden="true">
            <div className="ticker-line ticker-left">
              <span>Bio-Genics Lifecare</span>
              <span>Complete Sales Engine</span>
              <span>Pharma Distribution</span>
              <span>Field Force Management</span>
              <span>Real-time Insights</span>
              <span>Order Lifecycle</span>
              <span>Live Tracking</span>
              <span>Pipeline Management</span>
              <span>Bio-Genics Lifecare</span>
              <span>Complete Sales Engine</span>
              <span>Pharma Distribution</span>
              <span>Field Force Management</span>
            </div>
          </div>
        </div>

        <div className="feature-card">
          <FeaturePill icon="pipeline">Full pipeline from prospect to close</FeaturePill>
          <FeaturePill icon="order">End-to-end order lifecycle</FeaturePill>
          <FeaturePill icon="analytics">Real-time business insights</FeaturePill>
          <FeaturePill icon="location">Live field team location</FeaturePill>
        </div>
      </section>
    </main>
  );
}
