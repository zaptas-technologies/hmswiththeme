import { Schema } from "mongoose";
import { flexibleSchema } from "./common";
import {
  AppointmentSchema,
  DoctorSchema,
  PatientSchema,
  DoctorAppointmentSchema,
  PatientAppointmentSchema,
  DoctorPrescriptionSchema,
  PatientPrescriptionSchema,
  DoctorLeaveSchema,
} from "./clinical";
import {
  InvoiceSchema,
  TransactionSchema,
  ExpenseSchema,
  IncomeSchema,
  PaymentSchema,
  PayrollSchema,
} from "./finance";
import {
  AssetSchema,
  StaffSchema,
  LeaveSchema,
  ServiceSchema,
  SpecializationSchema,
  DesignationSchema,
} from "./admin";
import {
  AnnouncementSchema,
  BlogCategorySchema,
  BlogCommentSchema,
  PageSchema,
  NewsletterSchema,
  TestimonialSchema,
} from "./content";
import { CountrySchema, CitySchema, StateSchema, LocationSchema } from "./geo";

// Resource name -> schema mapping.
// Keep keys aligned with `deriveResourceName()` output.
export const schemaMap: Record<string, Schema> = {
  // content
  announcements: AnnouncementSchema,
  newsletters: NewsletterSchema,
  blogcategories: BlogCategorySchema,
  blogcomments: BlogCommentSchema,
  pages: PageSchema,
  testimonials: TestimonialSchema,

  // clinical
  appointments: AppointmentSchema,
  doctors: DoctorSchema,
  patients: PatientSchema,
  doctorappointments: DoctorAppointmentSchema,
  patientappointments: PatientAppointmentSchema,
  doctorprescriptions: DoctorPrescriptionSchema,
  patientprescriptions: PatientPrescriptionSchema,
  doctorleaves: DoctorLeaveSchema,

  // finance
  invoices: InvoiceSchema,
  transactions: TransactionSchema,
  expenses: ExpenseSchema,
  income: IncomeSchema,
  payments: PaymentSchema,
  payroll: PayrollSchema,

  // admin
  assets: AssetSchema,
  staffs: StaffSchema,
  leaves: LeaveSchema,
  service: ServiceSchema,
  services: ServiceSchema,
  specialization: SpecializationSchema,
  specializations: SpecializationSchema,
  designation: DesignationSchema,
  designations: DesignationSchema,

  // geo
  countries: CountrySchema,
  cities: CitySchema,
  state: StateSchema,
  states: StateSchema,
  location: LocationSchema,
  locations: LocationSchema,
};

export const getSchemaForResource = (resourceName: string): Schema => {
  return schemaMap[resourceName] ?? flexibleSchema();
};

