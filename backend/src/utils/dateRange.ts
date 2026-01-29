/**
 * Get start and end dates for a period, or use custom dateFrom/dateTo.
 */
export type Period =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last6months"
  | "all"
  // Backward-compatible (older UI)
  | "weekly"
  | "monthly"
  | "yearly";

export interface DashboardDateRange {
  start: Date;
  end: Date;
}

export function getDateRange(
  period: Period = "last30days",
  dateFrom?: string,
  dateTo?: string
): DashboardDateRange {
  const end = dateTo ? new Date(dateTo) : new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date();

  if (dateFrom && dateTo) {
    return { start: new Date(dateFrom), end: new Date(dateTo) };
  }

  if (dateFrom) {
    return { start: new Date(dateFrom), end: end > start ? end : new Date() };
  }

  // Pure period-based
  switch (period) {
    case "today": {
      const s = new Date(end);
      s.setHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "yesterday": {
      const s = new Date(end);
      s.setDate(s.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setDate(e.getDate() - 1);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "last7days":
    case "weekly": {
      const weekStart = new Date(end);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(end);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    }
    case "last30days": {
      const s = new Date(end);
      s.setDate(s.getDate() - 29);
      s.setHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "monthly": {
      const monthStart = new Date(end.getFullYear(), end.getMonth(), 1);
      const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };
    }
    case "last6months": {
      const s = new Date(end);
      s.setMonth(s.getMonth() - 6);
      s.setHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "all": {
      return { start: new Date(0), end };
    }
    case "yearly": {
      const yearStart = new Date(end.getFullYear(), 0, 1);
      const yearEnd = new Date(end.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start: yearStart, end: yearEnd };
    }
    default:
      return getDateRange("last30days");
  }
}

/** Leave filter: today, week, month */
export type LeavePeriod = "today" | "week" | "month";

export function getLeaveDateRange(period: LeavePeriod = "week"): DashboardDateRange {
  const end = new Date();
  let start: Date;
  switch (period) {
    case "today":
      start = new Date(end);
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
    default:
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
  }
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Build a MongoDB query for Date_Time stored as "DD MMM YYYY, hh:mm A" (e.g. "29 Jan 2026, 06:00 AM").
 * Returns { $or: [ { Date_Time: { $regex: "^DD MMM YYYY," } }, ... ] } for each day in range.
 */
export function appointmentDateFilterForRange(range: DashboardDateRange): { $or: Array<{ Date_Time: { $regex: string } }> } {
  const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
  const end = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
  const or: Array<{ Date_Time: { $regex: string } }> = [];
  const current = new Date(start);
  while (current <= end) {
    const d = current.getDate();
    const m = MONTH_NAMES[current.getMonth()];
    const y = current.getFullYear();
    const dayPattern = d < 10 ? `(${d}|0${d})` : `(${d})`;
    const escaped = `^${dayPattern} ${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} ${y},`;
    or.push({ Date_Time: { $regex: escaped } });
    current.setDate(current.getDate() + 1);
  }
  // Also support ISO Date_Time (lexicographic range works for ISO strings)
  // Example: "2026-01-29T10:15:00.000Z"
  const isoRange = { Date_Time: { $gte: range.start.toISOString(), $lte: range.end.toISOString() } } as any;
  return { $or: [...or, isoRange] };
}
