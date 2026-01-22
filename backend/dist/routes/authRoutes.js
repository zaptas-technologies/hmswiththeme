"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const requireUserId_1 = require("../middleware/requireUserId");
const buildAuthRouter = () => {
    const router = (0, express_1.Router)();
    router.post("/login", authController_1.login);
    router.post("/register", authController_1.register);
    router.get("/me", requireUserId_1.requireUserId, authController_1.getCurrentUser);
    return router;
};
exports.buildAuthRouter = buildAuthRouter;
