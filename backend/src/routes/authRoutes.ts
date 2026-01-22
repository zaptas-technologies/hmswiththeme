import { Router } from "express";
import { login, register, getCurrentUser } from "../controllers/authController";
import { requireUserId } from "../middleware/requireUserId";

export const buildAuthRouter = () => {
  const router = Router();
  router.post("/login", login);
  router.post("/register", register);
  router.get("/me", requireUserId, getCurrentUser);
  return router;
};
