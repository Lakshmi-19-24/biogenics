import biogenicsLogo from "../assets/biogenics.gif";

export default function AnimatedLogo({ size = 48, showText = true, className = "" }) {
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(59, 130, 246, 0.45)",
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    flexShrink: 0,
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  if (showText) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={containerStyle}>
          <img src={biogenicsLogo} alt="Bio-Genics Lifecare" style={imageStyle} />
        </div>
        <span>Bio-Genics Lifecare</span>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <img src={biogenicsLogo} alt="Bio-Genics Lifecare" style={imageStyle} />
    </div>
  );
}
