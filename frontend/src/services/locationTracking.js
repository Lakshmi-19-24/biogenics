import API from "./api";
import { getSocket } from "./socket";

let locationTrackingInterval = null;
let locationVisibilityHandler = null;

const GOOD_ACCURACY_METERS = 500;
const HARD_ACCURACY_CAP_METERS = 2000;
const SOCKET_ACK_TIMEOUT_MS = 8000;
const LOCATION_RETRY_ATTEMPTS = 2;
const LOCATION_RETRY_DELAY_MS = 1500;

/**
 * Reads a single geolocation fix (fresh, high accuracy, no cache).
 */
const readPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        resolve({ latitude, longitude, accuracy, speed: speed || 0, timestamp: position.timestamp || Date.now() });
      },
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

/**
 * Reads battery level without throwing.
 */
const readBattery = async () => {
  if (!navigator.getBattery) return null;
  try {
    const battery = await navigator.getBattery();
    return battery?.level ?? null;
  } catch {
    return null;
  }
};

/**
 * Get current geolocation with retries and accuracy gating.
 * - Accepts a good fix (<= 500m) immediately.
 * - Retries up to N times for a better fix when the first is coarse.
 * - Throws when every attempt exceeds the hard accuracy cap (2000m),
 *   so a bad/coarse fix is never sent to the backend.
 */
const getCurrentLocation = async () => {
  console.log("📍 Attempting to get current location...");
  let bestFix = null;

  for (let attempt = 0; attempt <= LOCATION_RETRY_ATTEMPTS; attempt += 1) {
    let fix;
    try {
      fix = await readPosition();
    } catch (error) {
      console.error("❌ Failed to get location:", error.message);
      if (attempt < LOCATION_RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, LOCATION_RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }

    console.log("📍 Location fix:", fix.latitude, fix.longitude, `accuracy ${Math.round(fix.accuracy)}m`);
    if (!bestFix || fix.accuracy < bestFix.accuracy) bestFix = fix;
    if (fix.accuracy <= GOOD_ACCURACY_METERS) break;

    console.warn(`⚠️ Coarse fix (${Math.round(fix.accuracy)}m), retrying for a better one...`);
    if (attempt < LOCATION_RETRY_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, LOCATION_RETRY_DELAY_MS));
    }
  }

  if (!bestFix || bestFix.accuracy > HARD_ACCURACY_CAP_METERS) {
    throw new Error("Unable to obtain an accurate GPS fix");
  }

  const battery = await readBattery();
  return {
    latitude: bestFix.latitude,
    longitude: bestFix.longitude,
    accuracy: bestFix.accuracy,
    speed: bestFix.speed,
    battery,
    metadata: {
      timestamp: new Date(bestFix.timestamp || Date.now()).toISOString(),
      userAgent: navigator.userAgent,
    },
  };
};

/**
 * Send location to backend via REST API
 */
export const sendLocationViaAPI = async () => {
  try {
    const location = await getCurrentLocation();
    const response = await API.post("/locations", {
      ...location,
      source: "manual",
      trackedAt: new Date(),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send location via API:", error);
    throw error;
  }
};

/**
 * Send location to backend via Socket.io, falling back to REST on failure
 * or when the server ack does not arrive within the timeout.
 */
export const sendLocationViaSocket = async () => {
  const socket = getSocket();
  if (!socket) {
    console.warn("Socket not initialized, falling back to API");
    return sendLocationViaAPI();
  }

  try {
    console.log("🌐 Initiating Socket location send...");
    const location = await getCurrentLocation();
    console.log("🌐 Location obtained, emitting to socket...");
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Socket ack timeout"));
      }, SOCKET_ACK_TIMEOUT_MS);
      socket.emit("sales:location:update", location, (response) => {
        clearTimeout(timer);
        console.log("🌐 Socket ack received:", response);
        if (response?.success) resolve(response);
        else reject(new Error(response?.message || "Failed to send location"));
      });
    });
  } catch (error) {
    console.error("Failed to send location via Socket:", error);
    return sendLocationViaAPI();
  }
};

/**
 * Fire-and-forget a single location ping via the preferred transport.
 */
const sendTrackingPing = (useSocket) => {
  const attempt = useSocket ? sendLocationViaSocket() : sendLocationViaAPI();
  attempt
    .then(() => console.log(useSocket ? "✅ Location sent via WebSocket!" : "✅ Location sent via API!"))
    .catch((error) => console.error("Failed to send location:", error));
};

/**
 * Start automatic location tracking (every 5 minutes).
 * The interval is created first so a hung send can never kill tracking.
 */
export const startAutoLocationTracking = (useSocket = true) => {
  // Clear any existing interval
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
  }

  // Set up the interval for every 5 minutes (300000 ms)
  locationTrackingInterval = setInterval(() => {
    sendTrackingPing(useSocket);
  }, 1 * 60 * 1000);

  // Send location immediately (non-blocking)
  sendTrackingPing(useSocket);

  // Fresh ping when the tab becomes visible again; best-effort last ping on minimize
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && locationTrackingInterval) {
      sendTrackingPing(useSocket);
    } else if (document.visibilityState === "hidden") {
      sendLocationViaAPI().catch((error) => console.error("Failed to send location on minimize:", error));
    }
  };
  if (locationVisibilityHandler) {
    document.removeEventListener("visibilitychange", locationVisibilityHandler);
  }
  locationVisibilityHandler = handleVisibilityChange;
  document.addEventListener("visibilitychange", handleVisibilityChange);

  console.log("Auto location tracking started (every 5 minutes)");
};

/**
 * Stop automatic location tracking
 */
export const stopAutoLocationTracking = () => {
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
    console.log("Auto location tracking stopped");
  }
  if (locationVisibilityHandler) {
    document.removeEventListener("visibilitychange", locationVisibilityHandler);
    locationVisibilityHandler = null;
  }
};

/**
 * Get latest location pings
 */
export const getLatestLocations = async () => {
  try {
    const response = await API.get("/locations/latest");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch latest locations:", error);
    throw error;
  }
};

/**
 * Get location history for a user
 */
export const getLocationHistory = async (query) => {
  try {
    const response = await API.get("/locations", { params: query });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch location history:", error);
    throw error;
  }
};

/**
 * Check if location tracking is active
 */
export const isLocationTrackingActive = () => {
  return locationTrackingInterval !== null;
};
