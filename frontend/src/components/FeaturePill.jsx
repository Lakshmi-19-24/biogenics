const icons = {
  pipeline: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h4m4 0h8M4 12h10m4 0h2M4 17h6m4 0h6" />
      <circle cx="10" cy="7" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="12" cy="17" r="2" />
    </svg>
  ),
  order: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8h14l-2 8H8L6 4H3" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5m0 14h16" />
      <path d="M8 16v-5m4 5V8m4 8v-7" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
};

export default function FeaturePill({ icon = "pipeline", children }) {
  return (
    <div className="feature-pill visual-feature-pill">
      <span className="visual-feature-icon">{icons[icon]}</span>
      <span>{children}</span>
    </div>
  );
}
