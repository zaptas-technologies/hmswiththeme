import mongoose from "mongoose";
import { Doctor } from "../models/doctorModel";
import { Patient } from "../models/patientModel";
import { Appointment } from "../models/appointmentModel";
import { DoctorLeave } from "../models/doctorLeaveModel";
import { Hospital } from "../models/hospitalModel";

const pctChange = (current: number, prev: number) => {
  if (prev <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const buildAdminDashboardPayload = async (hospitalId?: string) => {
  const now = new Date();
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

  const [doctorsCount, patientsCount, appointmentsCount] = await Promise.all([
    Doctor.countDocuments(hospitalFilter),
    Patient.countDocuments(hospitalFilter),
    Appointment.countDocuments(hospitalFilter),
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
    Appointment.countDocuments({ ...hospitalFilter, Date_Time: { $gte: sevenDaysAgo.toISOString(), $lt: now.toISOString() } }),
    Appointment.countDocuments({ ...hospitalFilter, Date_Time: { $gte: fourteenDaysAgo.toISOString(), $lt: sevenDaysAgo.toISOString() } }),
  ]);

  const revenueAgg = await Appointment.aggregate([
    { $match: { ...hospitalFilter, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
    { $group: { _id: null, total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const appointmentStats = await Appointment.aggregate([
    { $match: hospitalFilter },
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

  const allAppointments = appointmentsCount;
  const cancelled = statsMap.get("Cancelled") || 0;
  const reschedule = statsMap.get("Reschedule") || 0;
  const completed = statsMap.get("Checked Out") || statsMap.get("Completed") || statsMap.get("Confirmed") || 0;

  // Build doctor lookup filter to ensure we only get doctors from the same hospital
  const doctorLookupFilter: any = {};
  if (hospitalId) {
    doctorLookupFilter.hospital = new mongoose.Types.ObjectId(hospitalId);
  }

  const popularDoctors = await Appointment.aggregate([
    { $match: hospitalFilter },
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

  const recentAppointments = await Appointment.find(hospitalFilter)
    .sort({ Date_Time: 1 })
    .limit(10)
    .lean();

  const topDepartments = await Appointment.aggregate([
    { $match: { ...hospitalFilter, Department: { $exists: true, $ne: "" } } },
    { $group: { _id: "$Department", count: { $sum: 1 } } },
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
    { $match: { ...hospitalFilter, Department: { $exists: true, $ne: "" }, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
    {
      $group: {
        _id: "$Department",
        appointments: { $sum: 1 },
        revenue: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const topPatients = await Appointment.aggregate([
    { $match: hospitalFilter },
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
    ...hospitalFilter,
    Fees: { $exists: true, $ne: null },
    Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
  })
    .sort({ Date_Time: -1 })
    .limit(5)
    .lean();

  const leaveRequestsFilter = {
    ...leaveHospitalFilter,
    Status: { $in: ["Applied", "Pending", "Requested"] },
  };
  
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
  const appointmentsSparkline = await generateSparklineData(Appointment, "Date_Time");

  // Monthly appointment trend for chart
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  
  const allAppointmentsForYear = await Appointment.find(hospitalFilter).lean();
  const totalByMonth = Array(12).fill(0);
  const completedByMonth = Array(12).fill(0);
  
  allAppointmentsForYear.forEach((apt: any) => {
    if (apt.Date_Time) {
      try {
        const date = new Date(apt.Date_Time);
        if (!isNaN(date.getTime()) && date >= yearStart && date < yearEnd) {
          const month = date.getMonth();
          totalByMonth[month] += 1;
          if (apt.Status === "Checked Out" || apt.Status === "Completed" || apt.Status === "Confirmed") {
            completedByMonth[month] += 1;
          }
        }
      } catch {
        // Ignore invalid dates
      }
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
      doctorImg: "assets/img/doctors/doctor-01.jpg",
      patient: apt.Patient || "Unknown",
      patientImg: "assets/img/profiles/avatar-02.jpg",
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
