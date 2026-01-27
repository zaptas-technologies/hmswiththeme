import { Schema } from "mongoose";

export const AnnouncementSchema = new Schema(
  {
    CreatedOn: { type: String, required: true },
    Announcement: { type: String, required: true },
    Content: { type: String, required: true },
    Type: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const BlogCategorySchema = new Schema(
  {
    Categories: { type: String, required: true },
    Category: { type: String },
    Date: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const BlogCommentSchema = new Schema(
  {
    Blog: { type: String, required: true },
    Name: { type: String, required: true },
    Email: { type: String, required: true },
    Comment: { type: String, required: true },
    Date: { type: String, required: true },
    Status: { type: String },
  },
  { timestamps: true, strict: false }
);

export const PageSchema = new Schema(
  {
    PageName: { type: String, required: true },
    Slug: { type: String, required: true, unique: true },
    Content: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const NewsletterSchema = new Schema(
  {
    Email: { type: String, required: true, unique: true },
    SubscribedDate: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const TestimonialSchema = new Schema(
  {
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Rating: { type: String },
    Comment: { type: String },
    Date: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

