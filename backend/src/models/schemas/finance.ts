import { Schema } from "mongoose";

export const InvoiceSchema = new Schema(
  {
    InvoiceID: { type: String, required: true, unique: true },
    Patient: { type: String, required: true },
    Image: { type: String },
    CreatedDate: { type: String, required: true },
    DueDate: { type: String, required: true },
    Amount: { type: String, required: true },
    Status: {
      type: String,
      enum: ["Paid", "Partially Paid", "Unpaid"],
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

export const TransactionSchema = new Schema(
  {
    TransactionID: { type: String, required: true, unique: true },
    Patient: { type: String, required: true },
    Image: { type: String },
    Description: { type: String, required: true },
    PaidDate: { type: String, required: true },
    PaymentMethod: { type: String, required: true },
    Amount: { type: String, required: true },
    Status: { type: String, enum: ["Completed", "Pending"], required: true },
  },
  { timestamps: true, strict: false }
);

export const ExpenseSchema = new Schema(
  {
    Expense: { type: String, required: true },
    Category: { type: String, required: true },
    Amount: { type: String, required: true },
    Date: { type: String, required: true },
    Image: { type: String },
    PurchasedBy: { type: String, required: true },
    PaymentMethod: { type: String, required: true },
    Status: {
      type: String,
      enum: ["Approved", "Pending", "Rejected", "New"],
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

export const IncomeSchema = new Schema(
  {
    IncomeName: { type: String, required: true },
    Amount: { type: String, required: true },
    Date: { type: String, required: true },
    Image: { type: String },
    ReceivedFrom: { type: String, required: true },
    PaymentMethod: { type: String, required: true },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const PaymentSchema = new Schema(
  {
    id: { type: String },
    InvoiceID: { type: String },
    PaymentID: { type: String },
    Patient: { type: String, required: true },
    Image: { type: String },
    DoctorImage: { type: String },
    Doctor: { type: String },
    Position: { type: String },
    PaidDate: { type: String, required: true },
    PaymentMethod: { type: String, required: true },
    Amount: { type: String, required: true },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const PayrollSchema = new Schema(
  {
    Employee: { type: String, required: true },
    Image: { type: String },
    EmployeeID: { type: String },
    Role: { type: String },
    SalaryFor: { type: String, required: true },
    NetSalary: { type: String, required: true },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

