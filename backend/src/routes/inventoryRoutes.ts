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

export const buildInventoryRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllInventory);
  router.get("/search/medicines", authMiddleware, searchMedicines);
  router.get("/:id", authMiddleware, getInventoryById);
  router.post("/", authMiddleware, createInventory);
  router.patch("/:id", authMiddleware, updateInventory);
  router.delete("/:id", authMiddleware, deleteInventory);

  return router;
};
