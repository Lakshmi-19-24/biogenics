export const titleCase = (value = "") =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const mapLeadFromApi = (lead) => ({
  ...lead,
  name: lead.customerName || lead.name,
  company: lead.title || lead.company,
  status: titleCase(lead.status || "new"),
  source: titleCase(lead.source || "manual"),
});

export const mapLeadToApi = (lead) => ({
  title: lead.company || lead.title || lead.name,
  customerName: lead.name || lead.customerName,
  phone: lead.phone,
  email: lead.email,
  status: (lead.status || "New").toLowerCase().replace(/\s+/g, "_"),
  source: (lead.source || "manual").toLowerCase().replace(/\s+/g, "_"),
  notes: lead.notes,
});

export const mapOrderFromApi = (order) => ({
  ...order,
  orderId: order.orderNo || order.orderId,
  customer: order.customer?.name || order.customer,
  phone: order.customer?.phone || order.phone,
  totalAmount: order.grandTotal ?? order.totalAmount,
  status: {
    draft: "Pending",
    placed: "Confirmed",
    approved: "Confirmed",
    fulfilled: "Delivered",
    cancelled: "Cancelled",
  }[order.status] || titleCase(order.status || "pending"),
  items: Array.isArray(order.items)
    ? order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")
    : order.items,
});

export const mapAttendanceFromApi = (record) => ({
  ...record,
  checkIn: record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : record.checkIn,
  checkOut: record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : record.checkOut,
  hours: record.totalMinutes ? Math.round((record.totalMinutes / 60) * 10) / 10 : record.hours,
  status: titleCase(record.status || "present").replace("Half Day", "Half-day"),
});

export const mapAttendanceSessionsFromApi = (record) => {
  const sessions = Array.isArray(record.sessions) && record.sessions.length
    ? [...record.sessions].reverse()
    : [{
        checkInAt: record.checkInAt,
        checkOutAt: record.checkOutAt,
        totalMinutes: record.totalMinutes,
        breakMinutes: record.breakMinutes,
      }];

  return sessions
    .filter((session) => session.checkInAt || session.checkOutAt)
    .map((session, index) => mapAttendanceFromApi({
      ...record,
      ...session,
      _id: `${record._id || record.id}-session-${session._id || index}`,
      parentId: record._id || record.id,
      sessionId: session._id,
      sessions: undefined,
    }));
};

export const mapLocationFromApi = (ping) => ({
  ...ping,
  employeeName: ping.employee?.name || ping.employeeName || "Field executive",
  latitude: ping.location?.coordinates?.[1] ?? ping.latitude,
  longitude: ping.location?.coordinates?.[0] ?? ping.longitude,
});
