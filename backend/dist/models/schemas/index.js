"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaForResource = exports.schemaMap = void 0;
const common_1 = require("./common");
const clinical_1 = require("./clinical");
const finance_1 = require("./finance");
const admin_1 = require("./admin");
const content_1 = require("./content");
const geo_1 = require("./geo");
// Resource name -> schema mapping.
// Keep keys aligned with `deriveResourceName()` output.
exports.schemaMap = {
    // content
    announcements: content_1.AnnouncementSchema,
    newsletters: content_1.NewsletterSchema,
    blogcategories: content_1.BlogCategorySchema,
    blogcomments: content_1.BlogCommentSchema,
    pages: content_1.PageSchema,
    testimonials: content_1.TestimonialSchema,
    // clinical
    appointments: clinical_1.AppointmentSchema,
    doctors: clinical_1.DoctorSchema,
    patients: clinical_1.PatientSchema,
    doctorappointments: clinical_1.DoctorAppointmentSchema,
    patientappointments: clinical_1.PatientAppointmentSchema,
    doctorprescriptions: clinical_1.DoctorPrescriptionSchema,
    patientprescriptions: clinical_1.PatientPrescriptionSchema,
    // finance
    invoices: finance_1.InvoiceSchema,
    transactions: finance_1.TransactionSchema,
    expenses: finance_1.ExpenseSchema,
    income: finance_1.IncomeSchema,
    payments: finance_1.PaymentSchema,
    payroll: finance_1.PayrollSchema,
    // admin
    assets: admin_1.AssetSchema,
    staffs: admin_1.StaffSchema,
    leaves: admin_1.LeaveSchema,
    service: admin_1.ServiceSchema,
    services: admin_1.ServiceSchema,
    specialization: admin_1.SpecializationSchema,
    specializations: admin_1.SpecializationSchema,
    designation: admin_1.DesignationSchema,
    designations: admin_1.DesignationSchema,
    // geo
    countries: geo_1.CountrySchema,
    cities: geo_1.CitySchema,
    state: geo_1.StateSchema,
    states: geo_1.StateSchema,
    location: geo_1.LocationSchema,
    locations: geo_1.LocationSchema,
};
const getSchemaForResource = (resourceName) => {
    return exports.schemaMap[resourceName] ?? (0, common_1.flexibleSchema)();
};
exports.getSchemaForResource = getSchemaForResource;
