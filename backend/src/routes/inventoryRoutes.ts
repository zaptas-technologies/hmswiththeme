import { Router } from "express";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  searchMedicines,
} from "../controllers/inventoryController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildInventoryRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllInventory);
  router.get("/search/medicines", authMiddleware, searchMedicines);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updateInventory);
  router.get("/:id", authMiddleware, getInventoryById);
  router.post("/", authMiddleware, createInventory);
  router.delete("/:id", authMiddleware, deleteInventory);

  return router;
};
