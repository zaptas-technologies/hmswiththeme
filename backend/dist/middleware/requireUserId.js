"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserId = void 0;
// Auth middleware: supports token-based auth (Authorization header) or legacy x-user-id header
const requireUserId = (req, res, next) => {
    // Try token-based auth first
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.substring(7);
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            // Support both userId and doctorId for backward compatibility
            const userId = decoded.userId || decoded.doctorId;
            if (userId) {
                req.userId = userId;
                return next();
            }
        }
        catch (err) {
            // Invalid token format, fall through to other methods
        }
    }
    // Fallback to legacy header/query param (for backward compatibility)
    const headerUserId = req.header("x-user-id");
    const queryUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const userId = headerUserId || queryUserId;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized. Provide Authorization Bearer token, x-user-id header, or ?userId= query param.",
        });
    }
    req.userId = userId;
    next();
};
exports.requireUserId = requireUserId;
