"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserId = void 0;
/** Re-export authMiddleware as requireUserId for backward compatibility. */
var authMiddleware_1 = require("../middlewares/authMiddleware");
Object.defineProperty(exports, "requireUserId", { enumerable: true, get: function () { return authMiddleware_1.authMiddleware; } });
