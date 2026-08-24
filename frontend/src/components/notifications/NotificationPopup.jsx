import { useEffect, useState } from "react";
import { Bell, X, Check, FileText } from "lucide-react";

import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  initSocket,
  onNotification,
  offNotification,
} from "../../services/socket";

export default function NotificationPopup() {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    // Make sure socket is initialized before
    // registering the notification listener.
    initSocket(token);

    const handleNotification = (notification) => {
      console.log("🔔 POPUP RECEIVED:", notification);

      setNotifications((prev) => {
        const id = notification?._id || notification?.id;

        if (!id) return prev;

        return [
          notification,
          ...prev.filter(
            (item) => (item?._id || item?.id) !== id
          ),
        ].slice(0, 5);
      });
    };

    onNotification(handleNotification);

    return () => {
      offNotification(handleNotification);
    };
  }, [token]);

  const closeNotification = (notification) => {
    const id = notification?._id || notification?.id;

    setNotifications((prev) =>
      prev.filter(
        (item) => (item?._id || item?.id) !== id
      )
    );
  };

  const markRead = async (notification) => {
    const id = notification?._id || notification?.id;

    if (!id) return;

    try {
      await API.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.filter(
          (item) => (item?._id || item?.id) !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark notification read:",
        error
      );
    }
  };

  if (!notifications.length) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "78px",
        right: "24px",
        zIndex: 99999,
        width: "390px",
        maxWidth: "calc(100vw - 32px)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {notifications.map((notification) => {
        const id =
          notification?._id || notification?.id;

        const isDocumentReminder =
          notification?.data?.action ===
          "document_reminder";

        return (
          <div
            key={id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "16px",
              boxShadow:
                "0 15px 40px rgba(0,0,0,0.25)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              animation:
                "slideInNotification 0.3s ease-out",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: isDocumentReminder
                  ? "rgba(37,99,235,0.12)"
                  : "rgba(37,99,235,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isDocumentReminder ? (
                <FileText
                  size={21}
                  style={{ color: "#2563EB" }}
                />
              ) : (
                <Bell
                  size={21}
                  style={{ color: "#2563EB" }}
                />
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: "5px",
                }}
              >
                {notification.title ||
                  "Pending Work"}
              </p>

              {isDocumentReminder && (
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "5px",
                  }}
                >
                  📄{" "}
                  {notification.data
                    ?.documentTitle ||
                    "Document"}
                </p>
              )}

              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "var(--text-muted)",
                }}
              >
                {notification.message ||
                  "You have pending work."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    padding: "7px 12px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                  onClick={() =>
                    markRead(notification)
                  }
                >
                  <Check size={13} />
                  Got it
                </button>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() =>
                closeNotification(notification)
              }
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>
        {`
          @keyframes slideInNotification {
            from {
              opacity: 0;
              transform: translateX(30px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
}