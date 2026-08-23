import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import { fetchLatestLocations, sendLocationPing, upsertLiveLocation } from "../../store/slices/trackingSlice";
import { offLocationUpdate, onLocationUpdate } from "../../services/socket";
import { MapPin, RefreshCw, Users, Crosshair } from "lucide-react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function GPSTracking() {
  const dispatch = useDispatch();
  const { latest, ownPings, status, lastUpdated } = useSelector((state) => state.tracking);
  const { user } = useSelector((state) => state.auth);
  const [sending, setSending] = useState(false);
  const canViewTeam = ["owner", "admin", "manager"].includes(user?.role);

  useEffect(() => {
    if (canViewTeam) dispatch(fetchLatestLocations());
  }, [canViewTeam, dispatch]);

  useEffect(() => {
    if (!canViewTeam) return undefined;
    onLocationUpdate((payload) => dispatch(upsertLiveLocation(payload)));
    return () => offLocationUpdate();
  }, [canViewTeam, dispatch]);

  useEffect(() => {
    if (!canViewTeam) return undefined;
    const intervalId = setInterval(() => {
      dispatch(fetchLatestLocations());
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [canViewTeam, dispatch]);

  const locations = useMemo(() => {
    const source = canViewTeam ? latest : ownPings;
    return source.map((item) => ({
      ...item,
      latitude: Number(item.latitude || 0),
      longitude: Number(item.longitude || 0),
      name: item.employeeName || item.employee?.name || user?.name || "Field executive",
    }));
  }, [canViewTeam, latest, ownPings, user?.name]);

  const capturePing = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    setSending(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await dispatch(sendLocationPing(position)).unwrap();
          toast.success("Current GPS location saved");
          if (canViewTeam) dispatch(fetchLatestLocations());
        } catch {
          toast.error("Unable to save location");
        } finally {
          setSending(false);
        }
      },
      () => {
        toast.error("Allow location access to share your GPS position");
        setSending(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const center = locations.length ? [locations[0].latitude, locations[0].longitude] : [12.9716, 77.5946];

  if (status === "loading" && locations.length === 0)
    return <LoadingSpinner text="Loading tracking data..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Live"
        title="GPS Tracking"
        subtitle="GPS-verified field monitoring and visit accountability"
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn-ghost" onClick={() => canViewTeam && dispatch(fetchLatestLocations())}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <button className="btn-primary" onClick={capturePing} disabled={sending}>
              <Crosshair size={15} />
              {sending ? "Saving..." : "Share GPS"}
            </button>
          </div>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 18px", background: "rgba(17,24,39,0.88)", borderRadius: "14px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: "18px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pulse-live" />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#10B981" }}>
            {canViewTeam ? "Team Feed Active" : "Personal GPS Capture"}
          </span>
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
          Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "after first sync"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-3)", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "999px", padding: "4px 10px" }}>
          <Users size={14} /> {locations.length} tracked
        </div>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", marginBottom: "18px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(10,15,30,0.82)", border: "1px solid var(--border)", borderRadius: "10px", position: "absolute", top: "12px", left: "12px", right: "12px", zIndex: 500, backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={16} style={{ color: "#60A5FA" }} />
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>Live Map</span>
          </div>
          <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", fontWeight: 700, background: "var(--emerald-dim)", color: "var(--emerald-bright)" }}>
            OSM Live
          </span>
        </div>

        <MapContainer center={center} zoom={12} style={{ height: "420px", minHeight: "380px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {locations.map((loc, i) => (
            <Marker key={i} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <strong>{loc.name}</strong>
                <br />
                {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                {typeof loc.accuracy === "number" && (
                  <>
                    <br />
                    ±{Math.round(loc.accuracy)} m accuracy
                  </>
                )}
                <br />
                {loc.trackedAt ? new Date(loc.trackedAt).toLocaleString("en-IN") : "Just now"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 800, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Latest GPS Records</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>Team location feed</p>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "999px", padding: "4px 10px" }}>{locations.length} records</span>
        </div>

        <div style={{ padding: "12px" }}>
          {locations.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "130px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
              No GPS records yet. Share GPS to create the first tracking point.
            </div>
          ) : locations.map((location) => (
            <div key={`${location._id || location.name}-row`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", marginBottom: "8px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>
                  {String(location.name || "F").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "7px" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />{location.name}</p>
                  <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-3)" }}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                  {typeof location.accuracy === "number" && (
                    <p className="font-mono" style={{ fontSize: "11px", color: location.accuracy <= 500 ? "var(--emerald-bright)" : "#F59E0B" }}>
                      ±{Math.round(location.accuracy)} m accuracy
                    </p>
                  )}
                </div>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right", flexShrink: 0 }}>
                {location.trackedAt ? new Date(location.trackedAt).toLocaleString("en-IN") : "Just now"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
