"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOne = exports.updateOne = exports.createOne = exports.getById = exports.getAll = exports.listResources = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const resourceRegistry_1 = require("../models/resourceRegistry");
const findDocById = async (model, id) => {
    const objectId = mongoose_1.default.isValidObjectId(id) && typeof id === "string"
        ? new mongoose_1.default.Types.ObjectId(id)
        : null;
    const match = [];
    if (objectId)
        match.push({ _id: objectId });
    match.push({ id });
    return model.findOne({ $or: match.filter(Boolean) });
};
const listResources = (resources) => {
    return (_req, res) => {
        res.json({ resources });
    };
};
exports.listResources = listResources;
const getAll = (resources) => async (req, res) => {
    const { resource } = req.params;
    if (!resources.includes(resource)) {
        return res.status(404).json({ message: "Resource not found" });
    }
    const limit = Number(req.query.limit ?? 100);
    const page = Number(req.query.page ?? 1);
    const skip = (page - 1) * limit;
    const sort = req.query.sort ?? "-createdAt";
    const Model = (0, resourceRegistry_1.getResourceModel)(resource);
    const [items, total] = await Promise.all([
        Model.find().sort(sort).skip(skip).limit(limit),
        Model.countDocuments(),
    ]);
    res.json({
        data: items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
};
exports.getAll = getAll;
const getById = (resources) => async (req, res) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
        return res.status(404).json({ message: "Resource not found" });
    }
    const Model = (0, resourceRegistry_1.getResourceModel)(resource);
    const doc = await findDocById(Model, id);
    if (!doc)
        return res.status(404).json({ message: "Record not found" });
    res.json(doc);
};
exports.getById = getById;
const createOne = (resources) => async (req, res) => {
    const { resource } = req.params;
    if (!resources.includes(resource)) {
        return res.status(404).json({ message: "Resource not found" });
    }
    const Model = (0, resourceRegistry_1.getResourceModel)(resource);
    const doc = await Model.create(req.body);
    res.status(201).json(doc);
};
exports.createOne = createOne;
const updateOne = (resources) => async (req, res) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
        return res.status(404).json({ message: "Resource not found" });
    }
    const Model = (0, resourceRegistry_1.getResourceModel)(resource);
    const doc = await findDocById(Model, id);
    if (!doc)
        return res.status(404).json({ message: "Record not found" });
    // Don't allow updating id or _id fields - preserve them
    const { id: _ignoredId, _id: _ignoredMongoId, ...updateData } = req.body;
    Object.assign(doc, updateData);
    await doc.save();
    res.json(doc);
};
exports.updateOne = updateOne;
const deleteOne = (resources) => async (req, res) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
        return res.status(404).json({ message: "Resource not found" });
    }
    const Model = (0, resourceRegistry_1.getResourceModel)(resource);
    const doc = await findDocById(Model, id);
    if (!doc)
        return res.status(404).json({ message: "Record not found" });
    await doc.deleteOne();
    res.status(204).send();
};
exports.deleteOne = deleteOne;
