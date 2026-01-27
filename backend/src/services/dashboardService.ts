import mongoose from "mongoose";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardPatient } from "../models/dashboardPatientModel";
import { DashboardAvailability } from "../models/dashboardAvailabilityModel";
import { Appointment } from "../models/appointmentModel";
import { Doctor } from "../models/doctorModel";
import { User } from "../models/userModel";

const pctChange = (current: number, prev: number) => {
  if (prev <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const buildDashboardPayload = async (doctorId: string) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const user = await User.findById(doctorId).select("email").lean().exec();
  let doctorName = "";
  if (user?.email) {
    const doctor = await Doctor.findOne({
      $or: [
        { Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    })
      .select("Name_Designation")
      .lean()
      .exec() as { Name_Designation?: string } | null;
    if (doctor) {
      doctorName = doctor.Name_Designation || "";
    }
  }

  const doctorFilter = doctorName ? { Doctor: doctorName } : {};

  const [availabilityDocs, allAppointments] = await Promise.all([
    DashboardAvailability.find({ doctorId }).sort({ day: 1 }).lean(),
    Appointment.find(doctorFilter).lean(),
  ]);

  // Calculate counts from regular appointments
  const totalCount = allAppointments.length;
  const onlineCount = allAppointments.filter((a: any) => a.Mode === "Online").length;
  const cancelledCount = allAppointments.filter((a: any) => a.Status === "Cancelled").length;

  // Parse dates from appointments and filter
  const parseAppointmentDate = (dateTimeStr: string): Date => {
    try {
      // Try to parse "DD MMM YYYY, hh:mm A" format
      const monthMap: Record<string, number> = {
        "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
      };
      const match = dateTimeStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
      if (match) {
        const [, day, month, year, hour, minute, ampm] = match;
        const monthNum = monthMap[month];
        if (monthNum !== undefined) {
          let hour24 = parseInt(hour, 10);
          if (ampm.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
          if (ampm.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;
          return new Date(parseInt(year, 10), monthNum, parseInt(day, 10), hour24, parseInt(minute, 10));
        }
      }
      // Fallback to native Date parsing
      return new Date(dateTimeStr);
    } catch {
      return new Date();
    }
  };

  const last7Total = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return apptDate >= sevenDaysAgo && apptDate < now;
  }).length;

  const prev7Total = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return apptDate >= fourteenDaysAgo && apptDate < sevenDaysAgo;
  }).length;

  const last7Online = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return a.Mode === "Online" && apptDate >= sevenDaysAgo && apptDate < now;
  }).length;

  const prev7Online = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return a.Mode === "Online" && apptDate >= fourteenDaysAgo && apptDate < sevenDaysAgo;
  }).length;

  const last7Cancelled = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return a.Status === "Cancelled" && apptDate >= sevenDaysAgo && apptDate < now;
  }).length;

  const prev7Cancelled = allAppointments.filter((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    return a.Status === "Cancelled" && apptDate >= fourteenDaysAgo && apptDate < sevenDaysAgo;
  }).length;

  const heroCards = [
    {
      id: "total-appointments",
      title: "Total Appointments",
      value: totalCount,
      deltaPct: Math.abs(pctChange(last7Total, prev7Total)),
      deltaDirection: pctChange(last7Total, prev7Total) >= 0 ? "up" : "down",
      badgeTone: pctChange(last7Total, prev7Total) >= 0 ? "success" : "danger",
      spark: {
        data: await (async () => {
          const start = startOfDay(sevenDaysAgo);
          const days = Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
          const buckets = new Map<string, number>();
          allAppointments.forEach((a: any) => {
            const apptDate = parseAppointmentDate(a.Date_Time);
            if (apptDate >= start && apptDate < now) {
              const dateKey = apptDate.toISOString().slice(0, 10);
              buckets.set(dateKey, (buckets.get(dateKey) || 0) + 1);
            }
          });
          return days.map((d) => buckets.get(d.toISOString().slice(0, 10)) || 0);
        })(),
        color: "#2e3192",
      },
      changeSummary: `${pctChange(last7Total, prev7Total) >= 0 ? "+" : ""}${pctChange(last7Total, prev7Total)}% in last 7 days`,
    },
    // {
    //   id: "online-consultations",
    //   title: "Online Consultations",
    //   value: onlineCount,
    //   deltaPct: Math.abs(pctChange(last7Online, prev7Online)),
    //   deltaDirection: pctChange(last7Online, prev7Online) >= 0 ? "up" : "down",
    //   badgeTone: pctChange(last7Online, prev7Online) >= 0 ? "success" : "danger",
    //   spark: {
    //     data: await (async () => {
    //       const start = startOfDay(sevenDaysAgo);
    //       const days = Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
    //       const buckets = new Map<string, number>();
    //       allAppointments.forEach((a: any) => {
    //         const apptDate = parseAppointmentDate(a.Date_Time);
    //         if (a.Mode === "Online" && apptDate >= start && apptDate < now) {
    //           const dateKey = apptDate.toISOString().slice(0, 10);
    //           buckets.set(dateKey, (buckets.get(dateKey) || 0) + 1);
    //         }
    //       });
    //       return days.map((d) => buckets.get(d.toISOString().slice(0, 10)) || 0);
    //     })(),
    //     color: "#E04F16",
    //   },
    //   changeSummary: `${pctChange(last7Online, prev7Online) >= 0 ? "+" : ""}${pctChange(last7Online, prev7Online)}% in last 7 days`,
    // },
    {
      id: "cancelled-appointments",
      title: "Cancelled Appointments",
      value: cancelledCount,
      deltaPct: Math.abs(pctChange(last7Cancelled, prev7Cancelled)),
      deltaDirection: pctChange(last7Cancelled, prev7Cancelled) >= 0 ? "up" : "down",
      badgeTone: pctChange(last7Cancelled, prev7Cancelled) >= 0 ? "success" : "danger",
      spark: {
        data: await (async () => {
          const start = startOfDay(sevenDaysAgo);
          const days = Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
          const buckets = new Map<string, number>();
          allAppointments.forEach((a: any) => {
            const apptDate = parseAppointmentDate(a.Date_Time);
            if (a.Status === "Cancelled" && apptDate >= start && apptDate < now) {
              const dateKey = apptDate.toISOString().slice(0, 10);
              buckets.set(dateKey, (buckets.get(dateKey) || 0) + 1);
            }
          });
          return days.map((d) => buckets.get(d.toISOString().slice(0, 10)) || 0);
        })(),
        color: "#0E9384",
      },
      changeSummary: `${pctChange(last7Cancelled, prev7Cancelled) >= 0 ? "+" : ""}${pctChange(last7Cancelled, prev7Cancelled)}% in last 7 days`,
    },
  ];

  // Find upcoming appointment from regular appointments
  const upcomingAppointments = allAppointments
    .map((a: any) => ({
      ...a,
      parsedDate: parseAppointmentDate(a.Date_Time),
    }))
    .filter((a: any) => a.parsedDate >= now && a.Status !== "Cancelled")
    .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime());

  const upcomingAppt = upcomingAppointments[0];
  const upcoming = upcomingAppt
    ? {
        appointmentId: String(upcomingAppt._id || upcomingAppt.id || ""),
        patientName: upcomingAppt.Patient || "-",
        patientCode: `#${String(upcomingAppt._id || upcomingAppt.id || "").slice(-6).toUpperCase()}`,
        visitType: upcomingAppt.Reason || "General Visit",
        department: upcomingAppt.Department || "General",
        mode: upcomingAppt.Mode === "Online" ? "Online Consultation" : "In-Person",
        datetime: upcomingAppt.parsedDate.toISOString(),
        avatar: upcomingAppt.Patient_Image || "assets/img/profiles/avatar-06.jpg",
      }
    : {
        appointmentId: "",
        patientName: "-",
        patientCode: "-",
        visitType: "-",
        department: "-",
        mode: "-",
        datetime: new Date().toISOString(),
        avatar: "assets/img/profiles/avatar-06.jpg",
      };

  // Calculate status stats from regular appointments
  const statusMap = new Map<string, number>();
  allAppointments.forEach((a: any) => {
    const status = a.Status || "Schedule";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  
  const appointmentStats = {
    completed: statusMap.get("Checked Out") || 0,
    pending: (statusMap.get("Schedule") || 0) + (statusMap.get("Scheduled") || 0) + (statusMap.get("Confirmed") || 0),
    cancelled: statusMap.get("Cancelled") || 0,
  };

  // Calculate monthly stats from regular appointments
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  
  const totalByMonth = Array(12).fill(0);
  const completedByMonth = Array(12).fill(0);
  
  allAppointments.forEach((a: any) => {
    const apptDate = parseAppointmentDate(a.Date_Time);
    if (apptDate >= yearStart && apptDate < yearEnd) {
      const month = apptDate.getMonth();
      totalByMonth[month]++;
      if (a.Status === "Checked Out") {
        completedByMonth[month]++;
      }
    }
  });

  // Get recent appointments from regular appointments collection
  const recentAppointmentsData = allAppointments
    .map((a: any) => ({
      ...a,
      parsedDate: parseAppointmentDate(a.Date_Time),
    }))
    .sort((a: any, b: any) => b.parsedDate.getTime() - a.parsedDate.getTime())
    .slice(0, 10);

  const recentAppointments = recentAppointmentsData.map((a: any) => ({
    id: String(a._id || a.id || ""),
    patient: {
      name: a.Patient || "N/A",
      phone: a.Phone || "N/A",
      avatar: a.Patient_Image || "assets/img/profiles/avatar-06.jpg",
    },
    datetime: a.parsedDate.toISOString(),
    mode: a.Mode || "In-Person",
    status: a.Status || "Schedule",
    fee: parseFloat(a.Fees as string) || 0,
  }));

  // Calculate top patients from regular appointments
  const patientAppointmentCount = new Map<string, { count: number; patient: any }>();
  allAppointments.forEach((a: any) => {
    const patientKey = `${a.Patient}_${a.Phone}`;
    const existing = patientAppointmentCount.get(patientKey);
    if (existing) {
      existing.count++;
    } else {
      patientAppointmentCount.set(patientKey, {
        count: 1,
        patient: {
          name: a.Patient,
          phone: a.Phone,
          avatar: a.Patient_Image || "assets/img/profiles/avatar-06.jpg",
        },
      });
    }
  });

  const topPatients = Array.from(patientAppointmentCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((p, idx) => ({
      id: `patient-${idx}`,
      name: p.patient.name,
      phone: p.patient.phone,
      avatar: p.patient.avatar,
      appointments: p.count,
    }));

  const totalPatients = patientAppointmentCount.size;

  const tiles = [
    { id: "total-patient", label: "Total Patient", value: totalPatients, trend: "Last 7 days", tone: "success" },
    // { id: "video-consultation", label: "Video Consultation", value: onlineCount, trend: "Last 7 days", tone: "success" },
    // { id: "rescheduled", label: "Rescheduled", value: 0, trend: "Last 7 days", tone: "warning" },
    { id: "pre-visit", label: "Pre Visit Bookings", value: last7Total, trend: "Last 7 days", tone: "success" },
    // { id: "walkin", label: "Walkin Bookings", value: 0, trend: "Last 7 days", tone: "info" },
    // { id: "follow-ups", label: "Follow Ups", value: 0, trend: "Last 7 days", tone: "success" },
  ];

  // ensure models are initialized in mongoose for lookups
  void mongoose.modelNames();

  return {
    meta: {
      doctorId,
      generatedAt: new Date().toISOString(),
      currency: "USD",
    },
    heroCards,
    upcoming,
    availability: availabilityDocs.map((a: any) => ({ day: a.day, window: a.window })),
    appointmentTrend: { categories: monthLabels, total: totalByMonth, completed: completedByMonth },
    tiles,
    appointmentStats,
    recentAppointments,
    topPatients,
  };
};
