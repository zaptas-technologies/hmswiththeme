import { useState, useEffect } from "react";
import { DatePicker, TimePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Link } from "react-router";
import {
  Recures_Every,
  Session,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useAuth } from "../../../../../core/context/AuthContext";
import { fetchSchedule, saveSchedule, type DaySchedule, type TimeSlot } from "../../../../../api/schedule";
import { fetchLocations } from "../../../../../api/locations";

interface ScheduleRow {
  id: number;
  session: string;
  from: Dayjs | null;
  to: Dayjs | null;
}

interface LocationOption {
  value: string;
  label: string;
}

const DoctorSchedules = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Locations state
  const [locations, setLocations] = useState<LocationOption[]>([
    { value: "Select", label: "Select" },
  ]);

  // Form state
  const [location, setLocation] = useState("Select");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [recursEvery, setRecursEvery] = useState(Recures_Every[0]?.value || "");

  // Separate state for each day's schedules
  const [mondaySchedules, setMondaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now(), session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [tuesdaySchedules, setTuesdaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 1, session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [wednesdaySchedules, setWednesdaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 2, session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [thursdaySchedules, setThursdaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 3, session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [fridaySchedules, setFridaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 4, session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [saturdaySchedules, setSaturdaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 5, session: Session[0]?.value || "", from: null, to: null },
  ]);
  const [sundaySchedules, setSundaySchedules] = useState<ScheduleRow[]>([
    { id: Date.now() + 6, session: Session[0]?.value || "", from: null, to: null },
  ]);

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await fetchLocations();
        // Convert locations to select options format
        const locationOptions: LocationOption[] = [
          { value: "Select", label: "Select" },
          ...data
            .filter((loc) => loc.Status === "Active") // Only show active locations
            .map((loc) => ({
              value: loc.Location || loc.Clinic_Name || loc.id,
              label: loc.Location || loc.Clinic_Name || "Unknown Location",
            })),
        ];
        setLocations(locationOptions);
      } catch (err: any) {
        console.error("Error loading locations:", err);
        // Keep default "Select" option on error
      }
    };

    loadLocations();
  }, []);

  // Load schedule data on mount
  useEffect(() => {
    const loadSchedule = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fetchSchedule(token);

        // Set form fields
        setLocation(data.location || "Select");
        setFromDate(data.fromDate ? dayjs(data.fromDate) : null);
        setToDate(data.toDate ? dayjs(data.toDate) : null);
        setRecursEvery(data.recursEvery || Recures_Every[0]?.value || "");

        // Map schedules to state
        const dayMap: Record<string, React.Dispatch<React.SetStateAction<ScheduleRow[]>>> = {
          Monday: setMondaySchedules,
          Tuesday: setTuesdaySchedules,
          Wednesday: setWednesdaySchedules,
          Thursday: setThursdaySchedules,
          Friday: setFridaySchedules,
          Saturday: setSaturdaySchedules,
          Sunday: setSundaySchedules,
        };

        data.schedules.forEach((daySchedule) => {
          const setter = dayMap[daySchedule.day];
          if (setter && daySchedule.timeSlots.length > 0) {
            const rows: ScheduleRow[] = daySchedule.timeSlots.map((slot, idx) => ({
              id: Date.now() + idx,
              session: slot.session,
              from: slot.from ? dayjs(`2000-01-01 ${slot.from}`, "YYYY-MM-DD HH:mm") : null,
              to: slot.to ? dayjs(`2000-01-01 ${slot.to}`, "YYYY-MM-DD HH:mm") : null,
            }));
            setter(rows);
          } else if (setter) {
            // Ensure at least one empty row
            setter([{ id: Date.now(), session: Session[0]?.value || "", from: null, to: null }]);
          }
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [token]);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  // Generic add/delete handlers for each day
  const handleAddSchedule = (day: string) => {
    const newRow: ScheduleRow = {
      id: Date.now() + Math.random(),
      session: Session[0]?.value || "",
      from: null,
      to: null,
    };
    switch (day) {
      case "monday":
        setMondaySchedules([...mondaySchedules, newRow]);
        break;
      case "tuesday":
        setTuesdaySchedules([...tuesdaySchedules, newRow]);
        break;
      case "wednesday":
        setWednesdaySchedules([...wednesdaySchedules, newRow]);
        break;
      case "thursday":
        setThursdaySchedules([...thursdaySchedules, newRow]);
        break;
      case "friday":
        setFridaySchedules([...fridaySchedules, newRow]);
        break;
      case "saturday":
        setSaturdaySchedules([...saturdaySchedules, newRow]);
        break;
      case "sunday":
        setSundaySchedules([...sundaySchedules, newRow]);
        break;
      default:
        break;
    }
  };

  const handleDeleteSchedule = (day: string, id: number) => {
    switch (day) {
      case "monday":
        setMondaySchedules(mondaySchedules.filter((row) => row.id !== id));
        break;
      case "tuesday":
        setTuesdaySchedules(tuesdaySchedules.filter((row) => row.id !== id));
        break;
      case "wednesday":
        setWednesdaySchedules(
          wednesdaySchedules.filter((row) => row.id !== id)
        );
        break;
      case "thursday":
        setThursdaySchedules(thursdaySchedules.filter((row) => row.id !== id));
        break;
      case "friday":
        setFridaySchedules(fridaySchedules.filter((row) => row.id !== id));
        break;
      case "saturday":
        setSaturdaySchedules(saturdaySchedules.filter((row) => row.id !== id));
        break;
      case "sunday":
        setSundaySchedules(sundaySchedules.filter((row) => row.id !== id));
        break;
      default:
        break;
    }
  };

  const handleTimeChange = (
    day: string,
    id: number,
    field: "from" | "to",
    time: Dayjs | null
  ) => {
    const updateSchedule = (
      schedules: ScheduleRow[],
      setter: React.Dispatch<React.SetStateAction<ScheduleRow[]>>
    ) => {
      setter(
        schedules.map((row) =>
          row.id === id ? { ...row, [field]: time } : row
        )
      );
    };

    switch (day) {
      case "monday":
        updateSchedule(mondaySchedules, setMondaySchedules);
        break;
      case "tuesday":
        updateSchedule(tuesdaySchedules, setTuesdaySchedules);
        break;
      case "wednesday":
        updateSchedule(wednesdaySchedules, setWednesdaySchedules);
        break;
      case "thursday":
        updateSchedule(thursdaySchedules, setThursdaySchedules);
        break;
      case "friday":
        updateSchedule(fridaySchedules, setFridaySchedules);
        break;
      case "saturday":
        updateSchedule(saturdaySchedules, setSaturdaySchedules);
        break;
      case "sunday":
        updateSchedule(sundaySchedules, setSundaySchedules);
        break;
    }
  };

  const handleSessionChange = (
    day: string,
    id: number,
    session: string
  ) => {
    const updateSchedule = (
      schedules: ScheduleRow[],
      setter: React.Dispatch<React.SetStateAction<ScheduleRow[]>>
    ) => {
      setter(
        schedules.map((row) =>
          row.id === id ? { ...row, session } : row
        )
      );
    };

    switch (day) {
      case "monday":
        updateSchedule(mondaySchedules, setMondaySchedules);
        break;
      case "tuesday":
        updateSchedule(tuesdaySchedules, setTuesdaySchedules);
        break;
      case "wednesday":
        updateSchedule(wednesdaySchedules, setWednesdaySchedules);
        break;
      case "thursday":
        updateSchedule(thursdaySchedules, setThursdaySchedules);
        break;
      case "friday":
        updateSchedule(fridaySchedules, setFridaySchedules);
        break;
      case "saturday":
        updateSchedule(saturdaySchedules, setSaturdaySchedules);
        break;
      case "sunday":
        updateSchedule(sundaySchedules, setSundaySchedules);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Not authenticated");
      return;
    }

    if (!location || !fromDate || !toDate || !recursEvery) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Convert schedules to API format
      const convertToDaySchedule = (
        dayName: string,
        schedules: ScheduleRow[]
      ): DaySchedule => {
        const timeSlots: TimeSlot[] = schedules
          .filter((row) => row.from && row.to)
          .map((row) => ({
            session: row.session,
            from: row.from!.format("HH:mm"),
            to: row.to!.format("HH:mm"),
          }));

        return {
          day: dayName as DaySchedule["day"],
          timeSlots,
        };
      };

      const schedules: DaySchedule[] = [
        convertToDaySchedule("Monday", mondaySchedules),
        convertToDaySchedule("Tuesday", tuesdaySchedules),
        convertToDaySchedule("Wednesday", wednesdaySchedules),
        convertToDaySchedule("Thursday", thursdaySchedules),
        convertToDaySchedule("Friday", fridaySchedules),
        convertToDaySchedule("Saturday", saturdaySchedules),
        convertToDaySchedule("Sunday", sundaySchedules),
      ];

      await saveSchedule(token, {
        location,
        fromDate: fromDate.format("YYYY-MM-DD"),
        toDate: toDate.format("YYYY-MM-DD"),
        recursEvery,
        schedules,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  // Helper to render schedule rows for a given day
  const renderScheduleRows = (schedules: ScheduleRow[], day: string) =>
    schedules.map((row, idx) => (
      <div className="row gx-3" key={row.id}>
        <div className="col-lg-5">
          <div className="mb-3">
            <label className="form-label">Session</label>
            <CommonSelect
              options={Session}
              className="select"
              value={row.session}
              onChange={(value) => handleSessionChange(day, row.id, value)}
            />
          </div>
        </div>
        <div className="col-lg-7">
          <div className="row align-items-end gx-3">
            <div className="col-lg-9">
              <div className="row gx-3">
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">From</label>
                    <div className="input-icon-end position-relative">
                      <TimePicker
                        className="form-control"
                        value={row.from}
                        onChange={(time) => handleTimeChange(day, row.id, "from", time)}
                        format="HH:mm"
                        defaultOpenValue={dayjs("00:00", "HH:mm")}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-clock-hour-10" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">To</label>
                    <div className="input-icon-end position-relative">
                      <TimePicker
                        className="form-control"
                        value={row.to}
                        onChange={(time) => handleTimeChange(day, row.id, "to", time)}
                        format="HH:mm"
                        defaultOpenValue={dayjs("00:00", "HH:mm")}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-clock-hour-10" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="mb-3 d-flex gap-2">
                {idx === 0 ? (
                  <Link
                    to="#"
                    className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddSchedule(day);
                    }}
                    title="Add"
                  >
                    <i className="ti ti-plus fs-16" />
                  </Link>
                ) : (
                  <Link
                    to="#"
                    className="delete-schedule-btn p-2 bg-danger btn-icon text-white rounded d-flex align-items-center justify-content-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteSchedule(day, row.id);
                    }}
                    title="Delete"
                  >
                    <i className="ti ti-trash fs-16" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ));

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="mb-0">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================
            Start Page Content
        ========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Row */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Start Page Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                <div className="flex-grow-1">
                  <h4 className="fw-bold mb-0"> My Schedule</h4>
                </div>
                <div className="text-end d-flex">
                  {/* dropdown*/}
                  <div className="dropdown me-1">
                    <Link
                      to="#"
                      className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Export
                      <i className="ti ti-chevron-down ms-2" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Download as PDF
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Download as Excel
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* End Page Header */}
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success mb-3" role="alert">
                  Schedule saved successfully!
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="card">
                  <div className="card-body">
                    <div className="border-bottom mb-3">
                      <h6 className="fw-bold mb-3">Schedule Detail</h6>
                      <div className="row">
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Location</label>
                            <CommonSelect
                              options={locations}
                              className="select"
                              value={location}
                              onChange={(value) => setLocation(value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">From</label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                value={fromDate}
                                onChange={(date) => setFromDate(date)}
                                format="DD-MM-YYYY"
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">To</label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                value={toDate}
                                onChange={(date) => setToDate(date)}
                                format="DD-MM-YYYY"
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Recures Every</label>
                            <CommonSelect
                              options={Recures_Every}
                              className="select"
                              value={recursEvery}
                              onChange={(value) => setRecursEvery(value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  <div>
                    <h6 className="fw-bold mb-3">Schedules</h6>
                    <ul
                      className="nav nav-pills schedule-tab mb-3"
                      id="pills-tab2"
                      role="tablist"
                    >
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto active"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-8"
                          type="button"
                          role="tab"
                          aria-selected="true"
                        >
                          Monday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-9"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Tuesday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-10"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Wednesday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-11"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Thursday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-12"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Friday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-13"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Saturday
                        </button>
                      </li>
                      <li className="nav-item me-1" role="presentation">
                        <button
                          className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                          data-bs-toggle="pill"
                          data-bs-target="#schedules-14"
                          type="button"
                          role="tab"
                          aria-selected="false"
                          tabIndex={-1}
                        >
                          Sunday
                        </button>
                      </li>
                    </ul>
                    <div className="tab-content" id="pills-tabContent2">
                      <div
                        className="tab-pane fade active show"
                        id="schedules-8"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(mondaySchedules, "monday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-9"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(tuesdaySchedules, "tuesday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-10"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(wednesdaySchedules, "wednesday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-11"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(thursdaySchedules, "thursday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-12"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(fridaySchedules, "friday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-13"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(saturdaySchedules, "saturday")}
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="schedules-14"
                        role="tabpanel"
                      >
                        <div className="add-schedule-list">
                          {renderScheduleRows(sundaySchedules, "sunday")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End card body */}
              </div>
              {/* End card */}
              <div className="modal-footer d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-white border"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* End Row */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
            End Page Content
        ========================= */}
    </>
  );
};

export default DoctorSchedules;
