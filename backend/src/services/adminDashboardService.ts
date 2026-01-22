import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";

const pctChange = (current: number, prev: number) => {
  if (prev <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const buildAdminDashboardPayload = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const DoctorModel = getResourceModel("doctors");
  const PatientModel = getResourceModel("patients");
  const AppointmentModel = getResourceModel("appointments");

  // Get counts
  const [doctorsCount, patientsCount, appointmentsCount] = await Promise.all([
    DoctorModel.countDocuments(),
    PatientModel.countDocuments(),
    AppointmentModel.countDocuments(),
  ]);

  // Get counts for last 7 days
  const [last7Doctors, prev7Doctors] = await Promise.all([
    DoctorModel.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: now } }),
    DoctorModel.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
  ]);

  const [last7Patients, prev7Patients] = await Promise.all([
    PatientModel.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: now } }),
    PatientModel.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
  ]);

  const [last7Appointments, prev7Appointments] = await Promise.all([
    AppointmentModel.countDocuments({ Date_Time: { $gte: sevenDaysAgo.toISOString(), $lt: now.toISOString() } }),
    AppointmentModel.countDocuments({ Date_Time: { $gte: fourteenDaysAgo.toISOString(), $lt: sevenDaysAgo.toISOString() } }),
  ]);

  // Calculate revenue (assuming appointments have fees)
  const revenueAgg = await AppointmentModel.aggregate([
    { $match: { Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
    { $group: { _id: null, total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  // Appointment statistics
  const appointmentStats = await AppointmentModel.aggregate([
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

  // Popular Doctors (by appointment count)
  const popularDoctors = await AppointmentModel.aggregate([
    { $group: { _id: "$Doctor", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "Name_Designation",
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

  // Recent Appointments (for calendar)
  const recentAppointments = await AppointmentModel.find()
    .sort({ Date_Time: 1 })
    .limit(10)
    .lean();

  // Top 3 Departments
  const topDepartments = await AppointmentModel.aggregate([
    { $match: { Department: { $exists: true, $ne: "" } } },
    { $group: { _id: "$Department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  // Doctors Schedule Stats
  const scheduleStats = await DoctorModel.aggregate([
    {
      $group: {
        _id: "$Status",
        count: { $sum: 1 },
      },
    },
  ]);

  const availableDoctors = scheduleStats.find((s: any) => s._id === "Available")?.count || 0;
  const unavailableDoctors = scheduleStats.find((s: any) => s._id === "Unavailable")?.count || 0;

  // Get doctors on leave (assuming there's a leave model or field)
  const DoctorLeaveModel = getResourceModel("doctorleaves");
  const leaveCount = await DoctorLeaveModel.countDocuments({
    $or: [
      { Status: "Approved" },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  });

  // Income By Treatment (Department)
  const incomeByTreatment = await AppointmentModel.aggregate([
    { $match: { Department: { $exists: true, $ne: "" }, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
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

  // Top 5 Patients (by appointment count)
  const topPatients = await AppointmentModel.aggregate([
    { $group: { _id: "$Patient", count: { $sum: 1 }, totalPaid: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "Patient",
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

  // Recent Transactions (from appointments with fees)
  const recentTransactions = await AppointmentModel.find({
    Fees: { $exists: true, $ne: null },
    Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
  })
    .sort({ Date_Time: -1 })
    .limit(5)
    .lean();

  // Leave Requests
  const leaveRequests = await DoctorLeaveModel.find({
    Status: { $in: ["Pending", "Requested"] },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Format leave requests with doctor info
  const formattedLeaveRequests = await Promise.all(
    leaveRequests.map(async (leave: any) => {
      const doctor = await DoctorModel.findOne({ _id: leave.doctorId }).lean() as any;
      return {
        id: String(leave._id),
        doctorName: doctor?.Name_Designation || "Unknown Doctor",
        doctorImg: doctor?.img || "assets/img/profiles/avatar-16.jpg",
        days: leave.days || 0,
        reason: leave.reason || "Personal Reason",
        startDate: leave.startDate,
        endDate: leave.endDate,
      };
    })
  );

  // Generate sparkline data for stats cards
  const generateSparklineData = async (model: mongoose.Model<any>, dateField: string, filter: any = {}) => {
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

  const doctorsSparkline = await generateSparklineData(DoctorModel, "createdAt");
  const patientsSparkline = await generateSparklineData(PatientModel, "createdAt");
  const appointmentsSparkline = await generateSparklineData(AppointmentModel, "Date_Time");

  // Monthly appointment trend for chart
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  
  // Since Date_Time is stored as string, we'll process in memory
  const allAppointmentsForYear = await AppointmentModel.find({}).lean();
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

  return {
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
    appointmentTrend: {
      categories: monthLabels,
      total: totalByMonth,
      completed: completedByMonth,
    },
  };
};
