import { RequestHandler } from "express";

/** For GET .../update routes: parse req.query.data (JSON string) into req.body so controllers can keep using req.body. */
export const parseUpdateQuery: RequestHandler = (req, res, next) => {
  const raw = req.query.data;
  if (raw == null || raw === "") {
    return res.status(400).json({ message: "Missing query parameter: data" });
  }
  try {
    const decoded = typeof raw === "string" ? decodeURIComponent(raw) : raw;
    (req as any).body = typeof decoded === "string" ? JSON.parse(decoded) : decoded;
    next();
  } catch {
    return res.status(400).json({ message: "Invalid data: must be JSON in query.data" });
  }
};
