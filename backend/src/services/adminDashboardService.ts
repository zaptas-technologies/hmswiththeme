import mongoose from "mongoose";
import { Doctor } from "../models/doctorModel";
import { Patient } from "../models/patientModel";
import { Appointment } from "../models/appointmentModel";
import { DoctorLeave } from "../models/doctorLeaveModel";
import { Hospital } from "../models/hospitalModel";
import { getDateRange, getLeaveDateRange, type Period, type LeavePeriod } from "../utils/dateRange";

const pctChange = (current: number, prev: number) => {
  if (prev <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export type DashboardFilters = {
  period?: Period;
  dateFrom?: string;
  dateTo?: string;
  leavePeriod?: LeavePeriod;
  limit?: number;
  type?: "all" | "in-person" | "online";
};

export const buildAdminDashboardPayload = async (hospitalId?: string, filters?: DashboardFilters) => {
  const now = new Date();
  const period = filters?.period ?? "last30days";
  const hasCustomRange = Boolean(filters?.dateFrom || filters?.dateTo);
  const shouldApplyDateRange = period !== "all" || hasCustomRange;
  const dateRange = shouldApplyDateRange ? getDateRange(period, filters?.dateFrom, filters?.dateTo) : null;
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Build hospital filter if hospitalId is provided
  // CRITICAL: When hospitalId is provided, ALL queries MUST filter by this hospital
  let hospitalFilter: any = {};
  if (hospitalId) {
    try {
      const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
      hospitalFilter = { hospital: hospitalObjectId };
    } catch (error) {
      throw new Error(`Invalid hospitalId format: ${hospitalId}`);
    }
  }

  // IMPORTANT: Use createdAt for filtering because Date_Time is stored as a string
  // and can have multiple formats (which makes reliable Mongo filtering difficult).
  const appointmentMatchBase: any = {
    ...hospitalFilter,
    ...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
  };
  const last7DaysRange = { start: sevenDaysAgo, end: now };
  const prev7DaysRange = { start: fourteenDaysAgo, end: sevenDaysAgo };

  const [doctorsCount, patientsCount, appointmentsCount] = await Promise.all([
    Doctor.countDocuments(hospitalFilter),
    Patient.countDocuments(hospitalFilter),
    Appointment.countDocuments(appointmentMatchBase),
  ]);

  const [last7Doctors, prev7Doctors] = await Promise.all([
    Doctor.countDocuments({ ...hospitalFilter, createdAt: { $gte: sevenDaysAgo, $lt: now } }),
    Doctor.countDocuments({ ...hospitalFilter, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
  ]);

  const [last7Patients, prev7Patients] = await Promise.all([
    Patient.countDocuments({ ...hospitalFilter, createdAt: { $gte: sevenDaysAgo, $lt: now } }),
    Patient.countDocuments({ ...hospitalFilter, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
  ]);

  const [last7Appointments, prev7Appointments] = await Promise.all([
    Appointment.countDocuments({ ...hospitalFilter, createdAt: { $gte: last7DaysRange.start, $lt: last7DaysRange.end } }),
    Appointment.countDocuments({ ...hospitalFilter, createdAt: { $gte: prev7DaysRange.start, $lt: prev7DaysRange.end } }),
  ]);

  const revenueAgg = await Appointment.aggregate([
    { $match: { ...appointmentMatchBase, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
    { $group: { _id: null, total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const appointmentStats = await Appointment.aggregate([
    { $match: appointmentMatchBase },
    {
      $group: {
        _id: "$Status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = new Map<string, number>();
  appointmentStats.forEach((stat: any) => {
    statsMap.set(stat._id || "Unknown", stat.count);
  });

  const allAppointments = appointmentStats.reduce((sum: number, s: any) => sum + (s.count || 0), 0);
  const cancelled = statsMap.get("Cancelled") || 0;
  const reschedule = statsMap.get("Reschedule") || 0;
  const completed = statsMap.get("Checked Out") || statsMap.get("Completed") || statsMap.get("Confirmed") || 0;

  // Build doctor lookup filter to ensure we only get doctors from the same hospital
  const doctorLookupFilter: any = {};
  if (hospitalId) {
    doctorLookupFilter.hospital = new mongoose.Types.ObjectId(hospitalId);
  }

  const popularDoctors = await Appointment.aggregate([
    { $match: appointmentMatchBase },
    { $group: { _id: "$Doctor", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: "doctors",
        let: { doctorName: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$Name_Designation", "$$doctorName"] },
                  ...(hospitalId ? [{ $eq: ["$hospital", new mongoose.Types.ObjectId(hospitalId)] }] : []),
                ],
              },
            },
          },
        ],
        as: "doctorInfo",
      },
    },
    { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$doctorInfo.Name_Designation", "$_id"] },
        role: { $ifNull: ["$doctorInfo.role", "$doctorInfo.Role", "Doctor"] },
        img: { $ifNull: ["$doctorInfo.img", "assets/img/doctors/doctor-01.jpg"] },
        bookings: "$count",
      },
    },
  ]);

  const appointmentTypeFilter =
    filters?.type && filters.type !== "all"
      ? { Mode: filters.type === "in-person" ? "In-Person" : filters.type === "online" ? "Online" : filters.type }
      : {};
  const recentAppointments = await Appointment.find({
    ...appointmentMatchBase,
    ...appointmentTypeFilter,
  })
    .sort({ createdAt: -1 })
    .limit(filters?.limit ?? 10)
    .lean();

  // Top Departments: many appointments may not have Department stored,
  // so derive it from linked doctor (doctorId -> doctors.Department).
  const topDepartments = await Appointment.aggregate([
    { $match: appointmentMatchBase },
    {
      $lookup: {
        from: "doctors",
        let: { doctorId: "$doctorId", doctorName: "$Doctor" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $and: [{ $ne: ["$$doctorId", null] }, { $eq: ["$_id", "$$doctorId"] }] },
                      { $and: [{ $ne: ["$$doctorName", null] }, { $eq: ["$Name_Designation", "$$doctorName"] }] },
                    ],
                  },
                  ...(hospitalId ? [{ $eq: ["$hospital", new mongoose.Types.ObjectId(hospitalId)] }] : []),
                ],
              },
            },
          },
          { $project: { Department: 1 } },
        ],
        as: "doctorInfo",
      },
    },
    { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        _dept: { $ifNull: ["$Department", "$doctorInfo.Department"] },
      },
    },
    { $match: { _dept: { $exists: true, $ne: "" } } },
    { $group: { _id: "$_dept", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const scheduleStats = await Doctor.aggregate([
    { $match: hospitalFilter },
    {
      $group: {
        _id: "$Status",
        count: { $sum: 1 },
      },
    },
  ]);

  const availableDoctors = scheduleStats.find((s: any) => s._id === "Available")?.count || 0;
  const unavailableDoctors = scheduleStats.find((s: any) => s._id === "Unavailable")?.count || 0;

  // For leave requests, filter by hospital if provided
  const leaveHospitalFilter = hospitalId ? { hospital: new mongoose.Types.ObjectId(hospitalId) } : {};
  const leavePeriod = filters?.leavePeriod ?? "week";
  const leaveRange = getLeaveDateRange(leavePeriod);
  const leaveCountFilter: any = {
    ...leaveHospitalFilter,
    $or: [
      { Status: "Approved" },
      { From_Date: { $lte: now }, To_Date: { $gte: now } },
    ],
  };

  const leaveCount = await DoctorLeave.countDocuments(leaveCountFilter);

  const scheduledDoctors = await Doctor.find({
    ...hospitalFilter,
    Status: "Available",
  })
    .select("Name_Designation role Department img")
    .limit(4)
    .lean();

  const incomeByTreatment = await Appointment.aggregate([
    { $match: { ...appointmentMatchBase, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
    {
      $lookup: {
        from: "doctors",
        let: { doctorId: "$doctorId", doctorName: "$Doctor" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $and: [{ $ne: ["$$doctorId", null] }, { $eq: ["$_id", "$$doctorId"] }] },
                      { $and: [{ $ne: ["$$doctorName", null] }, { $eq: ["$Name_Designation", "$$doctorName"] }] },
                    ],
                  },
                  ...(hospitalId ? [{ $eq: ["$hospital", new mongoose.Types.ObjectId(hospitalId)] }] : []),
                ],
              },
            },
          },
          { $project: { Department: 1 } },
        ],
        as: "doctorInfo",
      },
    },
    { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        _dept: { $ifNull: ["$Department", "$doctorInfo.Department"] },
      },
    },
    { $match: { _dept: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$_dept",
        appointments: { $sum: 1 },
        revenue: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const topPatients = await Appointment.aggregate([
    { $match: appointmentMatchBase },
    { $group: { _id: "$Patient", count: { $sum: 1 }, totalPaid: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "patients",
        let: { patientName: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$Patient", "$$patientName"] },
                  ...(hospitalId ? [{ $eq: ["$hospital", new mongoose.Types.ObjectId(hospitalId)] }] : []),
                ],
              },
            },
          },
        ],
        as: "patientInfo",
      },
    },
    { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$patientInfo.Patient", "$_id"] },
        phone: { $ifNull: ["$patientInfo.Phone", ""] },
        img: { $ifNull: ["$patientInfo.Patient_img", "assets/img/profiles/avatar-02.jpg"] },
        appointments: "$count",
        totalPaid: "$totalPaid",
      },
    },
  ]);

  const recentTransactions = await Appointment.find({
    ...appointmentMatchBase,
    Fees: { $exists: true, $ne: null },
    Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
  })
    .sort({ createdAt: -1 })
    .limit(filters?.limit ?? 5)
    .lean();

  const leaveRequestsFilter: any = {
    ...leaveHospitalFilter,
    Status: { $in: ["Applied", "Pending", "Requested"] },
  };
  if (leaveRange && leaveRange.start) {
    leaveRequestsFilter.From_Date = { $gte: leaveRange.start, $lte: leaveRange.end };
  }

  const leaveRequests = await DoctorLeave.find(leaveRequestsFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const formattedLeaveRequests = await Promise.all(
    leaveRequests.map(async (leave: any) => {
      // Try to find doctor by Doctor field (name) or Doctor_Id
      const doctorFilter: any = {};
      if (leave.Doctor) {
        doctorFilter.Name_Designation = leave.Doctor;
      } else if (leave.Doctor_Id) {
        doctorFilter._id = leave.Doctor_Id;
      }
      
      // Add hospital filter if provided
      if (hospitalId) {
        doctorFilter.hospital = new mongoose.Types.ObjectId(hospitalId);
      }
      
      const doctor = await Doctor.findOne(doctorFilter)
        .select("Name_Designation img")
        .lean()
        .exec() as { Name_Designation?: string; img?: string } | null;
      
      return {
        id: String(leave._id),
        doctorName: doctor?.Name_Designation || leave.Doctor || "Unknown Doctor",
        doctorImg: doctor?.img || "assets/img/profiles/avatar-16.jpg",
        days: leave.No_Of_Days || leave.Day || 0,
        reason: leave.Reason || leave.Leave_Type || "Personal Reason",
        startDate: leave.From_Date || leave.Date,
        endDate: leave.To_Date || leave.Date,
      };
    })
  );

  // Generate sparkline data for stats cards
  const generateSparklineData = async (model: mongoose.Model<any>, dateField: string, baseFilter: any = {}) => {
    const filter = { ...baseFilter, ...hospitalFilter };
    const start = startOfDay(sevenDaysAgo);
    const days = Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
    
    let buckets;
    if (dateField === "Date_Time") {
      // For appointments, Date_Time is a string, so we'll use a simpler approach
      const allDocs = await model.find(filter).lean();
      const map = new Map<string, number>();
      days.forEach((d) => map.set(d.toISOString().slice(0, 10), 0));
      
      allDocs.forEach((doc: any) => {
        if (doc.Date_Time) {
          try {
            // Try to parse the date string
            const dateStr = doc.Date_Time;
            const date = new Date(dateStr);
            if (!isNaN(date.getTime()) && date >= start && date < now) {
              const key = date.toISOString().slice(0, 10);
              map.set(key, (map.get(key) || 0) + 1);
            }
          } catch {
            // Ignore invalid dates
          }
        }
      });
      return days.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
    } else {
      buckets = await model.aggregate([
        { $match: { ...filter, [dateField]: { $gte: start, $lt: now } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
            c: { $sum: 1 },
          },
        },
      ]);
      const map = new Map<string, number>(buckets.map((b: any) => [b._id, b.c]));
      return days.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
    }
  };

  const doctorsSparkline = await generateSparklineData(Doctor, "createdAt");
  const patientsSparkline = await generateSparklineData(Patient, "createdAt");
  const appointmentsSparkline = await generateSparklineData(Appointment, "createdAt");

  // Monthly appointment trend for chart
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const monthlyAgg = await Appointment.aggregate([
    { $match: { ...hospitalFilter, createdAt: { $gte: yearStart, $lt: yearEnd } } },
    {
      $group: {
        _id: { m: { $month: "$createdAt" } },
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $in: ["$Status", ["Checked Out", "Completed", "Confirmed"]] }, 1, 0],
          },
        },
      },
    },
  ]);
  const totalByMonth = Array(12).fill(0);
  const completedByMonth = Array(12).fill(0);

  monthlyAgg.forEach((row: any) => {
    const monthIdx = Number(row?._id?.m) - 1; // $month is 1-12
    if (monthIdx >= 0 && monthIdx < 12) {
      totalByMonth[monthIdx] = row.total || 0;
      completedByMonth[monthIdx] = row.completed || 0;
    }
  });

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Fetch hospital info if hospitalId is provided
  let hospitalInfo: { id: string; name: string; city?: string; state?: string } | null = null;
  if (hospitalId) {
    try {
      const hospitalDoc = await Hospital.findById(hospitalId).select("name city state").lean();
      if (hospitalDoc && !Array.isArray(hospitalDoc)) {
        hospitalInfo = {
          id: hospitalId,
          name: (hospitalDoc as any).name || "",
          city: (hospitalDoc as any).city,
          state: (hospitalDoc as any).state,
        };
      }
    } catch (error) {
      // Hospital not found or error - continue without hospital info
    }
  }

  return {
    hospital: hospitalInfo,
    stats: {
      doctors: {
        count: doctorsCount,
        change: pctChange(last7Doctors, prev7Doctors),
        sparkline: doctorsSparkline,
      },
      patients: {
        count: patientsCount,
        change: pctChange(last7Patients, prev7Patients),
        sparkline: patientsSparkline,
      },
      appointments: {
        count: appointmentsCount,
        change: pctChange(last7Appointments, prev7Appointments),
        sparkline: appointmentsSparkline,
      },
      revenue: {
        amount: revenue,
        change: 25, // Calculate based on previous period if needed
        sparkline: appointmentsSparkline, // Reuse appointments sparkline
      },
    },
    appointmentStatistics: {
      all: allAppointments,
      cancelled,
      reschedule,
      completed,
    },
    popularDoctors: popularDoctors.map((d: any) => ({
      name: d.name,
      role: d.role,
      img: d.img,
      bookings: d.bookings,
    })),
    recentAppointments: recentAppointments.map((apt: any) => ({
      id: String(apt._id),
      doctor: apt.Doctor || "Unknown",
      doctorImg: apt.Doctor_Image || "assets/img/doctors/doctor-01.jpg",
      patient: apt.Patient || "Unknown",
      patientImg: apt.Patient_Image || "assets/img/profiles/avatar-02.jpg",
      dateTime: apt.Date_Time || "",
      mode: apt.Mode || "In-Person",
      status: apt.Status || "Schedule",
    })),
    topDepartments: topDepartments.map((d: any) => ({
      name: d._id,
      count: d.count,
    })),
    scheduleStats: {
      available: availableDoctors,
      unavailable: unavailableDoctors,
      leave: leaveCount,
    },
    incomeByTreatment: incomeByTreatment.map((t: any) => ({
      department: t._id,
      appointments: t.appointments,
      revenue: t.revenue,
    })),
    topPatients: topPatients.map((p: any) => ({
      name: p.name,
      phone: p.phone,
      img: p.img,
      appointments: p.appointments,
      totalPaid: p.totalPaid,
    })),
    recentTransactions: recentTransactions.map((t: any) => ({
      id: String(t._id),
      type: t.Mode || "General Check-up",
      invoice: `#INV${String(t._id).slice(-4).toUpperCase()}`,
      amount: parseFloat(t.Fees || 0),
      date: t.Date_Time,
    })),
    leaveRequests: formattedLeaveRequests,
    scheduledDoctors: scheduledDoctors.map((d: any) => ({
      id: String(d._id),
      name: d.Name_Designation?.split(" - ")[0] || d.Name_Designation || "Unknown Doctor",
      role: d.role || d.Department || "Doctor",
      img: d.img || "assets/img/doctors/doctor-01.jpg",
      department: d.Department || "",
    })),
    appointmentTrend: {
      categories: monthLabels,
      total: totalByMonth,
      completed: completedByMonth,
    },
  };
};

export type DashboardSectionName =
  | "stats"
  | "appointmentStatistics"
  | "popularDoctors"
  | "recentAppointments"
  | "topDepartments"
  | "scheduleStats"
  | "scheduledDoctors"
  | "incomeByTreatment"
  | "topPatients"
  | "recentTransactions"
  | "leaveRequests"
  | "appointmentTrend"
  | "allAppointments"
  | "doctorsList"
  | "patientsList";

type DoctorPerformanceRow = {
  id: string;
  name: string;
  role: string;
  img: string;
  department?: string;
  bookings: number;
  revenue: number;
};

type PatientPerformanceRow = {
  id: string;
  name: string;
  phone?: string;
  img?: string;
  appointments: number;
  totalPaid: number;
};

/** Returns only the requested section(s). For "schedule" returns scheduleStats + scheduledDoctors. */
export async function buildAdminDashboardSection(
  hospitalId: string | undefined,
  section: DashboardSectionName,
  filters?: DashboardFilters
): Promise<Record<string, unknown>> {
  // Lightweight sections (avoid building the full payload)
  if (section === "doctorsList" || section === "patientsList") {
    const now = new Date();
    const period = filters?.period ?? "last30days";
    const hasCustomRange = Boolean(filters?.dateFrom || filters?.dateTo);
    const shouldApplyDateRange = period !== "all" || hasCustomRange;
    const dateRange = shouldApplyDateRange ? getDateRange(period, filters?.dateFrom, filters?.dateTo) : null;

    let hospitalFilter: any = {};
    if (hospitalId) hospitalFilter = { hospital: new mongoose.Types.ObjectId(hospitalId) };

    const appointmentMatchBase: any = {
      ...hospitalFilter,
      ...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
    };

    if (section === "doctorsList") {
      const rows = await Appointment.aggregate([
        { $match: { ...appointmentMatchBase, doctorId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$doctorId",
            bookings: { $sum: 1 },
            revenue: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } },
          },
        },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            id: { $toString: "$_id" },
            name: { $ifNull: ["$doctor.Name_Designation", "Unknown Doctor"] },
            role: { $ifNull: ["$doctor.role", "$doctor.Department", "Doctor"] },
            img: { $ifNull: ["$doctor.img", "assets/img/doctors/doctor-01.jpg"] },
            department: { $ifNull: ["$doctor.Department", ""] },
            bookings: 1,
            revenue: 1,
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: filters?.limit ?? 50 },
      ]);

      return { doctorsList: rows as DoctorPerformanceRow[] };
    }

    // patientsList
    const rows = await Appointment.aggregate([
      { $match: appointmentMatchBase },
      {
        $group: {
          _id: "$Patient",
          appointments: { $sum: 1 },
          totalPaid: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } },
        },
      },
      {
        $lookup: {
          from: "patients",
          let: { patientName: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$Patient", "$$patientName"] },
                    ...(hospitalId ? [{ $eq: ["$hospital", new mongoose.Types.ObjectId(hospitalId)] }] : []),
                  ],
                },
              },
            },
            { $project: { Phone: 1, Patient_img: 1 } },
          ],
          as: "patientInfo",
        },
      },
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $ifNull: [{ $toString: "$patientInfo._id" }, "$_id"] },
          name: "$_id",
          phone: { $ifNull: ["$patientInfo.Phone", ""] },
          img: { $ifNull: ["$patientInfo.Patient_img", "assets/img/profiles/avatar-02.jpg"] },
          appointments: 1,
          totalPaid: 1,
        },
      },
      { $sort: { totalPaid: -1 } },
      { $limit: filters?.limit ?? 50 },
    ]);

    return { patientsList: rows as PatientPerformanceRow[] };
  }

  const full = await buildAdminDashboardPayload(hospitalId, filters);
  if (section === "allAppointments") {
    return { allAppointments: full.recentAppointments };
  }
  if (section === "scheduleStats" || section === "scheduledDoctors") {
    return {
      scheduleStats: full.scheduleStats,
      scheduledDoctors: full.scheduledDoctors,
    };
  }
  const key = section as keyof typeof full;
  if (key in full) {
    return { [section]: (full as any)[key] };
  }
  throw new Error(`Unknown section: ${section}`);
}
