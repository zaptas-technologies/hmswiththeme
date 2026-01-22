"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialSchema = exports.NewsletterSchema = exports.PageSchema = exports.BlogCommentSchema = exports.BlogCategorySchema = exports.AnnouncementSchema = void 0;
const mongoose_1 = require("mongoose");
exports.AnnouncementSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    CreatedOn: { type: String, required: true },
    Announcement: { type: String, required: true },
    Content: { type: String, required: true },
    Type: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.BlogCategorySchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Categories: { type: String, required: true },
    Category: { type: String },
    Date: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.BlogCommentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Blog: { type: String, required: true },
    Name: { type: String, required: true },
    Email: { type: String, required: true },
    Comment: { type: String, required: true },
    Date: { type: String, required: true },
    Status: { type: String },
}, { timestamps: true, strict: false });
exports.PageSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    PageName: { type: String, required: true },
    Slug: { type: String, required: true, unique: true },
    Content: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.NewsletterSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Email: { type: String, required: true, unique: true },
    SubscribedDate: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.TestimonialSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Rating: { type: String },
    Comment: { type: String },
    Date: { type: String, required: true },
}, { timestamps: true, strict: false });
