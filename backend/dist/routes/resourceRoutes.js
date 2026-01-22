"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResourceRouter = void 0;
const express_1 = require("express");
const resourceController_1 = require("../controllers/resourceController");
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const buildResourceRouter = (resources) => {
    const router = (0, express_1.Router)();
    router.get("/", (0, resourceController_1.listResources)(resources));
    router.get("/:resource", wrap((0, resourceController_1.getAll)(resources)));
    router.get("/:resource/:id", wrap((0, resourceController_1.getById)(resources)));
    router.post("/:resource", wrap((0, resourceController_1.createOne)(resources)));
    router.patch("/:resource/:id", wrap((0, resourceController_1.updateOne)(resources)));
    router.delete("/:resource/:id", wrap((0, resourceController_1.deleteOne)(resources)));
    return router;
};
exports.buildResourceRouter = buildResourceRouter;
