import { Router } from "express";
import { getNotificationStatus } from "../controllers/notificationController";

export const buildNotificationRouter = () => {
  const router = Router();
  router.get("/status", getNotificationStatus);
  return router;
};
