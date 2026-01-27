import { Router } from "express";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/inventoryController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildInventoryRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllInventory);
  router.get("/:id", authMiddleware, getInventoryById);
  router.post("/", authMiddleware, createInventory);
  router.patch("/:id", authMiddleware, updateInventory);
  router.delete("/:id", authMiddleware, deleteInventory);

  return router;
};
