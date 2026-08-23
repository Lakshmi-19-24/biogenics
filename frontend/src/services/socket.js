import io from "socket.io-client";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

export const initSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitLocationUpdate = (payload, callback) => {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("sales:location:update", payload, callback);
};

export const onLocationUpdate = (callback) => {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.on("sales:location:updated", callback);
};

export const onNotification = (callback) => {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.on("notification:new", callback);
};

export const onAttendanceUpdate = (callback) => {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.on("attendance:checked-in", callback);
  socket.on("attendance:checked-out", callback);
};

export const offLocationUpdate = () => {
  if (socket) {
    socket.off("sales:location:updated");
  }
};

export const offNotification = (callback) => {
  if (socket) {
    if (callback) socket.off("notification:new", callback);
    else socket.off("notification:new");
  }
};

export const offAttendanceUpdate = () => {
  if (socket) {
    socket.off("attendance:checked-in");
    socket.off("attendance:checked-out");
  }
};

// Auto-reconnection with token update
export const updateSocketAuth = (token) => {
  if (socket) {
    socket.auth = { token };
    socket.connect();
  }
};
