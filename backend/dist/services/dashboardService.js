"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDashboardPayload = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dashboardAppointmentModel_1 = require("../models/dashboardAppointmentModel");
const dashboardPatientModel_1 = require("../models/dashboardPatientModel");
const dashboardAvailabilityModel_1 = require("../models/dashboardAvailabilityModel");
const pctChange = (current, prev) => {
    if (prev <= 0)
        return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const buildDashboardPayload = async (doctorId) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const [availabilityDocs, totalCount, onlineCount, cancelledCount] = await Promise.all([
        dashboardAvailabilityModel_1.DashboardAvailability.find({ doctorId }).sort({ day: 1 }).lean(),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId }),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, mode: "Online" }),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, status: "Cancelled" }),
    ]);
    const [last7Total, prev7Total] = await Promise.all([
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, datetime: { $gte: sevenDaysAgo, $lt: now } }),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, datetime: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
    ]);
    const [last7Online, prev7Online] = await Promise.all([
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, mode: "Online", datetime: { $gte: sevenDaysAgo, $lt: now } }),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, mode: "Online", datetime: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
    ]);
    const [last7Cancelled, prev7Cancelled] = await Promise.all([
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, status: "Cancelled", datetime: { $gte: sevenDaysAgo, $lt: now } }),
        dashboardAppointmentModel_1.DashboardAppointment.countDocuments({ doctorId, status: "Cancelled", datetime: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
    ]);
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
                    const buckets = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
                        { $match: { doctorId, datetime: { $gte: start, $lt: now } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$datetime" } },
                                c: { $sum: 1 },
                            },
                        },
                    ]);
                    const map = new Map(buckets.map((b) => [b._id, b.c]));
                    return days.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
                })(),
                color: "#2e3192",
            },
            changeSummary: `${pctChange(last7Total, prev7Total) >= 0 ? "+" : ""}${pctChange(last7Total, prev7Total)}% in last 7 days`,
        },
        {
            id: "online-consultations",
            title: "Online Consultations",
            value: onlineCount,
            deltaPct: Math.abs(pctChange(last7Online, prev7Online)),
            deltaDirection: pctChange(last7Online, prev7Online) >= 0 ? "up" : "down",
            badgeTone: pctChange(last7Online, prev7Online) >= 0 ? "success" : "danger",
            spark: {
                data: await (async () => {
                    const start = startOfDay(sevenDaysAgo);
                    const days = Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
                    const buckets = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
                        { $match: { doctorId, mode: "Online", datetime: { $gte: start, $lt: now } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$datetime" } },
                                c: { $sum: 1 },
                            },
                        },
                    ]);
                    const map = new Map(buckets.map((b) => [b._id, b.c]));
                    return days.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
                })(),
                color: "#E04F16",
            },
            changeSummary: `${pctChange(last7Online, prev7Online) >= 0 ? "+" : ""}${pctChange(last7Online, prev7Online)}% in last 7 days`,
        },
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
                    const buckets = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
                        { $match: { doctorId, status: "Cancelled", datetime: { $gte: start, $lt: now } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$datetime" } },
                                c: { $sum: 1 },
                            },
                        },
                    ]);
                    const map = new Map(buckets.map((b) => [b._id, b.c]));
                    return days.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
                })(),
                color: "#0E9384",
            },
            changeSummary: `${pctChange(last7Cancelled, prev7Cancelled) >= 0 ? "+" : ""}${pctChange(last7Cancelled, prev7Cancelled)}% in last 7 days`,
        },
    ];
    const upcomingAgg = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
        { $match: { doctorId, datetime: { $gte: now }, status: { $ne: "Cancelled" } } },
        { $sort: { datetime: 1 } },
        { $limit: 1 },
        {
            $lookup: {
                from: "dashboardpatients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient",
            },
        },
        { $unwind: "$patient" },
    ]);
    const upcoming = upcomingAgg[0]
        ? {
            patientName: upcomingAgg[0].patient.name,
            patientCode: `#${String(upcomingAgg[0]._id).slice(-6).toUpperCase()}`,
            visitType: "General Visit",
            department: "General",
            mode: upcomingAgg[0].mode === "Online" ? "Online Consultation" : "In-Person",
            datetime: new Date(upcomingAgg[0].datetime).toISOString(),
            avatar: upcomingAgg[0].patient.avatar,
        }
        : {
            patientName: "-",
            patientCode: "-",
            visitType: "-",
            department: "-",
            mode: "-",
            datetime: new Date().toISOString(),
            avatar: "assets/img/profiles/avatar-06.jpg",
        };
    const statusBuckets = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
        { $match: { doctorId } },
        { $group: { _id: "$status", c: { $sum: 1 } } },
    ]);
    const statusMap = new Map(statusBuckets.map((b) => [b._id, b.c]));
    const appointmentStats = {
        completed: statusMap.get("Checked Out") || 0,
        pending: statusMap.get("Schedule") || 0,
        cancelled: statusMap.get("Cancelled") || 0,
    };
    const year = now.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const monthly = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
        { $match: { doctorId, datetime: { $gte: yearStart, $lt: yearEnd } } },
        {
            $group: {
                _id: { m: { $month: "$datetime" }, status: "$status" },
                c: { $sum: 1 },
            },
        },
    ]);
    const totalByMonth = Array(12).fill(0);
    const completedByMonth = Array(12).fill(0);
    for (const row of monthly) {
        const idx = row._id.m - 1;
        totalByMonth[idx] += row.c;
        if (row._id.status === "Checked Out")
            completedByMonth[idx] += row.c;
    }
    const recentAppointmentsAgg = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
        { $match: { doctorId } },
        { $sort: { datetime: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "dashboardpatients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient",
            },
        },
        { $unwind: "$patient" },
        {
            $project: {
                _id: 1,
                datetime: 1,
                mode: 1,
                status: 1,
                fee: 1,
                patient: { name: "$patient.name", phone: "$patient.phone", avatar: "$patient.avatar" },
            },
        },
    ]);
    const recentAppointments = recentAppointmentsAgg.map((a) => ({
        id: String(a._id),
        patient: a.patient,
        datetime: new Date(a.datetime).toISOString(),
        mode: a.mode,
        status: a.status,
        fee: a.fee,
    }));
    const topPatientsAgg = await dashboardAppointmentModel_1.DashboardAppointment.aggregate([
        { $match: { doctorId } },
        { $group: { _id: "$patientId", appointments: { $sum: 1 } } },
        { $sort: { appointments: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "dashboardpatients",
                localField: "_id",
                foreignField: "_id",
                as: "patient",
            },
        },
        { $unwind: "$patient" },
        {
            $project: {
                _id: 1,
                appointments: 1,
                name: "$patient.name",
                phone: "$patient.phone",
                avatar: "$patient.avatar",
            },
        },
    ]);
    const topPatients = topPatientsAgg.map((p) => ({
        id: String(p._id),
        name: p.name,
        phone: p.phone,
        avatar: p.avatar,
        appointments: p.appointments,
    }));
    const totalPatients = await dashboardPatientModel_1.DashboardPatient.countDocuments({ doctorId });
    const tiles = [
        { id: "total-patient", label: "Total Patient", value: totalPatients, trend: "Last 7 days", tone: "success" },
        { id: "video-consultation", label: "Video Consultation", value: onlineCount, trend: "Last 7 days", tone: "success" },
        { id: "rescheduled", label: "Rescheduled", value: 0, trend: "Last 7 days", tone: "warning" },
        { id: "pre-visit", label: "Pre Visit Bookings", value: last7Total, trend: "Last 7 days", tone: "success" },
        { id: "walkin", label: "Walkin Bookings", value: 0, trend: "Last 7 days", tone: "info" },
        { id: "follow-ups", label: "Follow Ups", value: 0, trend: "Last 7 days", tone: "success" },
    ];
    // ensure models are initialized in mongoose for lookups
    void mongoose_1.default.modelNames();
    return {
        meta: {
            doctorId,
            generatedAt: new Date().toISOString(),
            currency: "USD",
        },
        heroCards,
        upcoming,
        availability: availabilityDocs.map((a) => ({ day: a.day, window: a.window })),
        appointmentTrend: { categories: monthLabels, total: totalByMonth, completed: completedByMonth },
        tiles,
        appointmentStats,
        recentAppointments,
        topPatients,
    };
};
exports.buildDashboardPayload = buildDashboardPayload;
