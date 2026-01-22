import { RequestHandler } from "express";
import { ScheduleRequest } from "../controllers/scheduleController";

export const validateScheduleRequest: RequestHandler = (req, res, next) => {
  const { location, fromDate, toDate, recursEvery, schedules } = req.body as ScheduleRequest;

  // Validate required fields
  if (!location || typeof location !== "string" || location.trim() === "") {
    return res.status(400).json({ message: "Location is required and must be a non-empty string" });
  }

  if (!fromDate || typeof fromDate !== "string") {
    return res.status(400).json({ message: "From date is required and must be a valid date string (YYYY-MM-DD)" });
  }

  if (!toDate || typeof toDate !== "string") {
    return res.status(400).json({ message: "To date is required and must be a valid date string (YYYY-MM-DD)" });
  }

  if (!recursEvery || typeof recursEvery !== "string" || recursEvery.trim() === "") {
    return res.status(400).json({ message: "Recurs every is required and must be a non-empty string" });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromDate)) {
    return res.status(400).json({ message: "From date must be in YYYY-MM-DD format" });
  }

  if (!dateRegex.test(toDate)) {
    return res.status(400).json({ message: "To date must be in YYYY-MM-DD format" });
  }

  // Validate dates are valid
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  if (isNaN(from.getTime())) {
    return res.status(400).json({ message: "From date is not a valid date" });
  }

  if (isNaN(to.getTime())) {
    return res.status(400).json({ message: "To date is not a valid date" });
  }

  // Validate toDate is after fromDate
  if (to < from) {
    return res.status(400).json({ message: "To date must be after or equal to from date" });
  }

  // Validate schedules array
  if (!Array.isArray(schedules)) {
    return res.status(400).json({ message: "Schedules must be an array" });
  }

  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:mm format

  for (const daySchedule of schedules) {
    if (!daySchedule.day || !validDays.includes(daySchedule.day)) {
      return res.status(400).json({ 
        message: `Invalid day: ${daySchedule.day}. Must be one of: ${validDays.join(", ")}` 
      });
    }

    if (!Array.isArray(daySchedule.timeSlots)) {
      return res.status(400).json({ 
        message: `Time slots for ${daySchedule.day} must be an array` 
      });
    }

    for (const slot of daySchedule.timeSlots) {
      if (!slot.session || typeof slot.session !== "string") {
        return res.status(400).json({ 
          message: `Session is required for time slot in ${daySchedule.day}` 
        });
      }

      if (!slot.from || !timeRegex.test(slot.from)) {
        return res.status(400).json({ 
          message: `Invalid 'from' time format for ${daySchedule.day}. Must be HH:mm format` 
        });
      }

      if (!slot.to || !timeRegex.test(slot.to)) {
        return res.status(400).json({ 
          message: `Invalid 'to' time format for ${daySchedule.day}. Must be HH:mm format` 
        });
      }

      // Validate 'to' time is after 'from' time
      const [fromHour, fromMin] = slot.from.split(":").map(Number);
      const [toHour, toMin] = slot.to.split(":").map(Number);
      const fromMinutes = fromHour * 60 + fromMin;
      const toMinutes = toHour * 60 + toMin;

      if (toMinutes <= fromMinutes) {
        return res.status(400).json({ 
          message: `'To' time must be after 'from' time for ${daySchedule.day}` 
        });
      }
    }
  }

  next();
};
