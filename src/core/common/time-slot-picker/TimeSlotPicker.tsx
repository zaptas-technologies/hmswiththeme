import React, { useState, useEffect } from "react";
import { fetchAvailableSlots, type AvailableSlotsResponse } from "../../../api/appointments";
import dayjs, { type Dayjs } from "dayjs";

export interface TimeSlotPickerProps {
  doctorId: string;
  date: Dayjs | null;
  hospitalId?: string;
  value?: string; // Selected time in HH:mm format
  onChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  doctorId,
  date,
  hospitalId,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [slotsData, setSlotsData] = useState<AvailableSlotsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      if (!doctorId || !date) {
        setSlotsData(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const dateStr = date.format("YYYY-MM-DD");
        const data = await fetchAvailableSlots({
          doctorId,
          date: dateStr,
          hospitalId,
        });
        setSlotsData(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load available slots");
        setSlotsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [doctorId, date, hospitalId]);

  const handleSlotClick = (time: string) => {
    if (!disabled && onChange) {
      onChange(time);
    }
  };

  if (!doctorId || !date) {
    return (
      <div className={`time-slot-picker ${className}`}>
        <div className="alert alert-info mb-0">
          <i className="ti ti-info-circle me-2" />
          Please select a doctor and date to view available time slots.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`time-slot-picker ${className}`}>
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
          <p className="text-muted mb-0 small">Loading available slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`time-slot-picker ${className}`}>
        <div className="alert alert-warning mb-0">
          <i className="ti ti-alert-triangle me-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!slotsData) {
    return null;
  }

  const { availableSlots, slots = [], suggestions, message, slotDurationMinutes = 15 } = slotsData;

  // Prefer the full slots timeline (includes booked + available) when present
  const gridSlots =
    slots.length > 0
      ? slots
      : availableSlots.map((s) => ({
          ...s,
          isBooked: false,
        }));

  return (
    <div className={`time-slot-picker ${className}`}>
      {message && (
        <div className="alert alert-info mb-3">
          <i className="ti ti-info-circle me-2" />
          {message}
        </div>
      )}

      {gridSlots.length > 0 ? (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <label className="form-label mb-0 fw-medium">
              Available Time Slots
              <span className="text-danger ms-1">*</span>
            </label>
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted">
                Duration: {slotDurationMinutes} min per slot
              </small>
              <div className="d-flex align-items-center gap-2">
                <span className="time-slot-legend available" />
                <small className="text-muted">Available</small>
                <span className="time-slot-legend booked" />
                <small className="text-muted">Booked</small>
              </div>
            </div>
          </div>
          <div className="time-slot-grid">
            {gridSlots.map((slot) => {
              const isSelected = !slot.isBooked && value === slot.time;
              const isBooked = !!slot.isBooked;
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-slot-btn ${isSelected ? "active" : ""} ${
                    isBooked ? "booked" : ""
                  }`}
                  onClick={() => !isBooked && handleSlotClick(slot.time)}
                  disabled={disabled || isBooked}
                >
                  <span className="time-slot-btn__time">{slot.display}</span>
                  {isBooked && <span className="time-slot-btn__status">Booked</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="no-slots">
          <div className="alert alert-warning mb-3">
            <i className="ti ti-calendar-off me-2" />
            No available slots on this date.
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions">
              <h6 className="fw-semibold mb-2">
                <i className="ti ti-calendar-check me-2" />
                Suggested Available Dates:
              </h6>
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.date} className="suggestion-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <strong>{suggestion.day}</strong>
                        <span className="text-muted ms-2">
                          ({dayjs(suggestion.date).format("DD MMM YYYY")})
                        </span>
                      </div>
                      <div className="suggestion-slots">
                        {suggestion.timeSlots.map((ts, idx) => (
                          <span key={idx} className="badge badge-sm bg-light text-dark me-1">
                            {ts.from} - {ts.to}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
