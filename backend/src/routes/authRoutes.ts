import { Router } from "express";
import { login, register, getCurrentUser } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildAuthRouter = () => {
  const router = Router();
  router.post("/login", login);
  router.post("/register", register);
  router.get("/me", authMiddleware, getCurrentUser);
  return router;
};
