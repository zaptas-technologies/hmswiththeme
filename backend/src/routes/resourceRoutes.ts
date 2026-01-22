import { Router, RequestHandler } from "express";
import {
  createOne,
  deleteOne,
  getAll,
  getById,
  listResources,
  updateOne,
} from "../controllers/resourceController";

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const buildResourceRouter = (resources: string[]) => {
  const router = Router();

  router.get("/", listResources(resources));
  router.get("/:resource", wrap(getAll(resources)));
  router.get("/:resource/:id", wrap(getById(resources)));
  router.post("/:resource", wrap(createOne(resources)));
  router.patch("/:resource/:id", wrap(updateOne(resources)));
  router.delete("/:resource/:id", wrap(deleteOne(resources)));

  return router;
};
