import { Request, Response } from "express";
import mongoose from "mongoose";
import { getResourceModel } from "../models/resourceRegistry";

const findDocById = async (model: mongoose.Model<any>, id: string) => {
  const objectId =
    mongoose.isValidObjectId(id) && typeof id === "string"
      ? new mongoose.Types.ObjectId(id)
      : null;

  const match: Record<string, unknown>[] = [];
  if (objectId) match.push({ _id: objectId });
  match.push({ id });

  return model.findOne({ $or: match.filter(Boolean) });
};

export const listResources = (resources: string[]) => {
  return (_req: Request, res: Response) => {
    res.json({ resources });
  };
};

export const getAll =
  (resources: string[]) => async (req: Request, res: Response) => {
    const { resource } = req.params;
    if (!resources.includes(resource)) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const limit = Number(req.query.limit ?? 100);
    const page = Number(req.query.page ?? 1);
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) ?? "-createdAt";

    const Model = getResourceModel(resource);
    const [items, total] = await Promise.all([
      Model.find().sort(sort).skip(skip).limit(limit),
      Model.countDocuments(),
    ]);

    res.json({
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  };

export const getById =
  (resources: string[]) => async (req: Request, res: Response) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const Model = getResourceModel(resource);
    const doc = await findDocById(Model, id);
    if (!doc) return res.status(404).json({ message: "Record not found" });
    res.json(doc);
  };

export const createOne =
  (resources: string[]) => async (req: Request, res: Response) => {
    const { resource } = req.params;
    if (!resources.includes(resource)) {
      return res.status(404).json({ message: "Resource not found" });
    }
    const Model = getResourceModel(resource);
    const doc = await Model.create(req.body);
    res.status(201).json(doc);
  };

export const updateOne =
  (resources: string[]) => async (req: Request, res: Response) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
      return res.status(404).json({ message: "Resource not found" });
    }
    const Model = getResourceModel(resource);
    const doc = await findDocById(Model, id);
    if (!doc) return res.status(404).json({ message: "Record not found" });

    // Don't allow updating id or _id fields - preserve them
    const { id: _ignoredId, _id: _ignoredMongoId, ...updateData } = req.body;
    Object.assign(doc, updateData);
    await doc.save();
    res.json(doc);
  };

export const deleteOne =
  (resources: string[]) => async (req: Request, res: Response) => {
    const { resource, id } = req.params;
    if (!resources.includes(resource)) {
      return res.status(404).json({ message: "Resource not found" });
    }
    const Model = getResourceModel(resource);
    const doc = await findDocById(Model, id);
    if (!doc) return res.status(404).json({ message: "Record not found" });

    await doc.deleteOne();
    res.status(204).send();
  };
