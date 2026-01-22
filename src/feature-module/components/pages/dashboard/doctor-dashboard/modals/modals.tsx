import { DatePicker, TimePicker, type TimePickerProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../../../../core/context/AuthContext";
import {
  createAppointment,
  updateAppointment,
  type Appointment,
} from "../../../../../../api/appointments";
import { fetchPatients, type Patient } from "../../../../../../api/patients";
import { fetchDoctors } from "../../../../../../api/doctors";

const Modals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorName, setDoctorName] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<Dayjs | null>(null);
  const [reason, setReason] = useState("");
  const [appointmentId, setAppointmentId] = useState("");

  // For edit/view
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  // Find doctor by user email
  useEffect(() => {
    const findDoctor = async () => {
      if (!user?.email) return;
      try {
        const doctorsRes = await fetchDoctors({ limit: 100 });
        const doctorsList = Array.isArray(doctorsRes) ? doctorsRes : doctorsRes.data || [];
        const doctor = doctorsList.find(
          (d: any) => (d.Email || d.email || "").toLowerCase() === user.email.toLowerCase()
        );
        if (doctor) {
          setDoctorName(doctor.Name_Designation || "");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to find doctor:", err);
      }
    };
    findDoctor();
  }, [user]);

  // Load patients
  useEffect(() => {
    const loadData = async () => {
      try {
        const patientsRes = await fetchPatients({ limit: 100, sort: "Patient" });
        const patientsList = Array.isArray(patientsRes) ? patientsRes : patientsRes.data || [];
        setPatients(patientsList);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load patients:", err);
      }
    };
    loadData();
  }, []);

  // Listen for edit appointment modal open
  useEffect(() => {
    const editModal = document.getElementById("edit_appointment");
    if (!editModal) return;

    const handleShow = () => {
      // Get appointment from data attribute or global state
      const apptData = (window as any).selectedAppointmentForEdit;
      if (apptData) {
        setSelectedAppointment(apptData);
      }
    };

    editModal.addEventListener("show.bs.offcanvas", handleShow);
    return () => {
      editModal.removeEventListener("show.bs.offcanvas", handleShow);
    };
  }, []);

  // Populate edit form when selectedAppointment changes
  useEffect(() => {
    if (selectedAppointment) {
      const appt = selectedAppointment;
      setSelectedPatient(patients.find((p) => p.Patient === appt.Patient) || null);
      setSelectedMode(appt.Mode || "");
      setSelectedStatus(appt.Status || "");
      setReason(appt.Reason || "");
      setAppointmentId(appt._id || appt.id || "");

      // Parse date and time
      try {
        const dateTimeStr = appt.Date_Time;
        const parsed = dayjs(dateTimeStr, "DD MMM YYYY, hh:mm A");
        if (parsed.isValid()) {
          setAppointmentDate(parsed);
          setAppointmentTime(parsed);
        }
      } catch {
        // Try native parsing
        const parsed = dayjs(appt.Date_Time);
        if (parsed.isValid()) {
          setAppointmentDate(parsed);
          setAppointmentTime(parsed);
        }
      }
    } else {
      // Reset form
      setSelectedPatient(null);
      setSelectedMode("");
      setSelectedStatus("");
      setReason("");
      setAppointmentDate(null);
      setAppointmentTime(null);
      setAppointmentId(`AP${Date.now().toString().slice(-6)}`);
    }
  }, [selectedAppointment, patients]);

  // Load appointment for view details
  useEffect(() => {
    const viewModal = document.getElementById("view_details");
    if (!viewModal) return;

    const handleShow = () => {
      const apptData = (window as any).selectedAppointmentForView;
      if (apptData) {
        setViewAppointment(apptData);
      }
    };

    viewModal.addEventListener("show.bs.offcanvas", handleShow);
    return () => {
      viewModal.removeEventListener("show.bs.offcanvas", handleShow);
    };
  }, []);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const search = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.Patient.toLowerCase().includes(search) ||
        p.Phone.toLowerCase().includes(search) ||
        (p.Email || "").toLowerCase().includes(search)
    );
  }, [patients, patientSearch]);

  const onChangeTime: TimePickerProps["onChange"] = (time) => {
    setAppointmentTime(time);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient || !selectedMode || !appointmentDate || !appointmentTime || !selectedStatus) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const dateTime = appointmentDate
        .hour(appointmentTime.hour())
        .minute(appointmentTime.minute())
        .second(0);

      const appointmentData: Partial<Appointment> = {
        id: appointmentId,
        Date_Time: dateTime.format("DD MMM YYYY, hh:mm A"),
        Patient: selectedPatient.Patient,
        Phone: selectedPatient.Phone || "",
        Doctor: doctorName,
        Mode: selectedMode,
        Status: selectedStatus,
        Reason: reason || "",
        Patient_Image: selectedPatient.Patient_img || "",
      };

      await createAppointment(appointmentData);
      alert("Appointment created successfully!");
      
      // Close modal
      const offcanvas = document.getElementById("new_appointment");
      if (offcanvas) {
        const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
        if (bsOffcanvas) bsOffcanvas.hide();
      }

      // Reset form
      setSelectedPatient(null);
      setSelectedMode("");
      setSelectedStatus("");
      setReason("");
      setAppointmentDate(null);
      setAppointmentTime(null);
      setAppointmentId(`AP${Date.now().toString().slice(-6)}`);

      // Reload page to refresh dashboard
      window.location.reload();
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to create appointment:", error);
      alert(`Failed to create appointment: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppointment || !selectedPatient || !selectedMode || !appointmentDate || !appointmentTime || !selectedStatus) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const dateTime = appointmentDate
        .hour(appointmentTime.hour())
        .minute(appointmentTime.minute())
        .second(0);

      const appointmentData: Partial<Appointment> = {
        Date_Time: dateTime.format("DD MMM YYYY, hh:mm A"),
        Patient: selectedPatient.Patient,
        Phone: selectedPatient.Phone || "",
        Doctor: doctorName,
        Mode: selectedMode,
        Status: selectedStatus,
        Reason: reason || "",
        Patient_Image: selectedPatient.Patient_img || "",
      };

      const apptId = selectedAppointment._id || selectedAppointment.id;
      if (!apptId) {
        alert("Invalid appointment ID");
        return;
      }

      await updateAppointment(apptId, appointmentData);
      alert("Appointment updated successfully!");
      
      // Close modal
      const offcanvas = document.getElementById("edit_appointment");
      if (offcanvas) {
        const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
        if (bsOffcanvas) bsOffcanvas.hide();
      }

      // Reload page to refresh dashboard
      window.location.reload();
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to update appointment:", error);
      alert(`Failed to update appointment: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const parsed = dayjs(dateTimeStr, "DD MMM YYYY, hh:mm A");
      if (parsed.isValid()) {
        return parsed.format("dddd, DD MMM YYYY");
      }
      return dayjs(dateTimeStr).format("dddd, DD MMM YYYY");
    } catch {
      return dateTimeStr;
    }
  };

  const formatTimeRange = (dateTimeStr: string) => {
    try {
      const parsed = dayjs(dateTimeStr, "DD MMM YYYY, hh:mm A");
      if (parsed.isValid()) {
        const start = parsed.format("hh:mm A");
        const end = parsed.add(30, "minute").format("hh:mm A");
        return `${start} - ${end}`;
      }
      return dayjs(dateTimeStr).format("hh:mm A");
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <>
      {/* Start Add New Appointment */}
      <div
        className="offcanvas offcanvas-offset offcanvas-end"
        tabIndex={-1}
        id="new_appointment"
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">New Appointment</h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x bg-white fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-3">
          <form onSubmit={handleCreateAppointment}>
            {/* start row*/}
            <div className="row">
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Appointment ID <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded bg-light"
                      value={appointmentId || `AP${Date.now().toString().slice(-6)}`}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Patient<span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedPatient ? selectedPatient.Patient : "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <div className="mb-3">
                        <div className="input-icon-start position-relative">
                          <span className="input-icon-addon fs-12">
                            <i className="ti ti-search" />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <ul className="mb-3 list-style-none" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {filteredPatients.map((patient) => (
                          <li key={patient._id || patient.id}>
                            <label
                              className="dropdown-item px-2 d-flex align-items-center text-dark"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setSelectedPatient(patient);
                                setPatientSearch("");
                              }}
                            >
                              <input
                                className="form-check-input m-0 me-2"
                                type="radio"
                                checked={selectedPatient?._id === patient._id}
                                onChange={() => {}}
                              />
                              <span className="avatar avatar-sm rounded-circle me-2">
                                <ImageWithBasePath
                                  src={patient.Patient_img || "assets/img/profiles/avatar-06.jpg"}
                                  className="flex-shrink-0 rounded-circle"
                                  alt="img"
                                />
                              </span>
                              {patient.Patient}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Appointment Type <span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedMode || "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <ul className="mb-3 list-style-none">
                        <li>
                          <label
                            className="dropdown-item px-2 d-flex align-items-center text-dark"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedMode("In-Person")}
                          >
                            <input
                              className="form-check-input m-0 me-2"
                              type="radio"
                              checked={selectedMode === "In-Person"}
                              onChange={() => {}}
                            />
                            In Person
                          </label>
                        </li>
                        <li className="list-none">
                          <label
                            className="dropdown-item px-2 d-flex align-items-center text-dark"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedMode("Online")}
                          >
                            <input
                              className="form-check-input m-0 me-2"
                              type="radio"
                              checked={selectedMode === "Online"}
                              onChange={() => {}}
                            />
                            Online
                          </label>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Date of Appointment <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker"
                      format={{
                        format: "DD-MM-YYYY",
                        type: "mask",
                      }}
                      getPopupContainer={getModalContainer}
                      placeholder="dd-mm-yyyy"
                      suffixIcon={null}
                      value={appointmentDate}
                      onChange={(date) => setAppointmentDate(date)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Time <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon-end position-relative">
                    <TimePicker
                      className="form-control"
                      onChange={onChangeTime}
                      value={appointmentTime}
                      defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-clock" />
                    </span>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <div>
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Appointment Reason
                    </label>
                    <textarea
                      rows={4}
                      className="form-control rounded"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Status<span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedStatus || "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <ul className="mb-3 list-style-none">
                        {["Checked Out", "Checked In", "Cancelled", "Schedule", "Scheduled", "Confirmed"].map((status) => (
                          <li key={status}>
                            <label
                              className="dropdown-item px-2 d-flex align-items-center text-dark"
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedStatus(status)}
                            >
                              <input
                                className="form-check-input m-0 me-2"
                                type="radio"
                                checked={selectedStatus === status}
                                onChange={() => {}}
                              />
                              {status}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
            </div>
            {/* end row*/}
            <div className="offcanvas-footer mb-1 mt-3 p-3 border-1 border-top">
              <div className=" d-flex justify-content-end gap-2">
                <Link
                  to="#"
                  className="btn btn-light btm-md"
                  onClick={(e) => {
                    e.preventDefault();
                    const offcanvas = document.getElementById("new_appointment");
                    if (offcanvas) {
                      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                      if (bsOffcanvas) bsOffcanvas.hide();
                    }
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary btm-md"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Appointment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* End Add New Appointment*/}
      {/* Start Edit New Appointment */}
      <div
        className="offcanvas offcanvas-offset offcanvas-end"
        tabIndex={-1}
        id="edit_appointment"
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold"> Edit Appointment</h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x bg-white fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-3">
          <form onSubmit={handleUpdateAppointment}>
            {/* start row*/}
            <div className="row">
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Appointment ID <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded bg-light"
                      value={appointmentId}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Patient<span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedPatient ? selectedPatient.Patient : "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <div className="mb-3">
                        <div className="input-icon-start position-relative">
                          <span className="input-icon-addon fs-12">
                            <i className="ti ti-search" />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <ul className="mb-3 list-style-none" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {filteredPatients.map((patient) => (
                          <li key={patient._id || patient.id}>
                            <label
                              className="dropdown-item px-2 d-flex align-items-center text-dark"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setSelectedPatient(patient);
                                setPatientSearch("");
                              }}
                            >
                              <input
                                className="form-check-input m-0 me-2"
                                type="radio"
                                checked={selectedPatient?._id === patient._id}
                                onChange={() => {}}
                              />
                              <span className="avatar avatar-sm rounded-circle me-2">
                                <ImageWithBasePath
                                  src={patient.Patient_img || "assets/img/profiles/avatar-06.jpg"}
                                  className="flex-shrink-0 rounded-circle"
                                  alt="img"
                                />
                              </span>
                              {patient.Patient}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Appointment Type <span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedMode || "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <ul className="mb-0 list-style-none">
                        <li>
                          <label
                            className="dropdown-item px-2 d-flex align-items-center text-dark"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedMode("In-Person")}
                          >
                            <input
                              className="form-check-input m-0 me-2"
                              type="radio"
                              checked={selectedMode === "In-Person"}
                              onChange={() => {}}
                            />
                            In Person
                          </label>
                        </li>
                        <li className="list-none">
                          <label
                            className="dropdown-item px-2 d-flex align-items-center text-dark"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedMode("Online")}
                          >
                            <input
                              className="form-check-input m-0 me-2"
                              type="radio"
                              checked={selectedMode === "Online"}
                              onChange={() => {}}
                            />
                            Online
                          </label>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Date of Appointment <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker"
                      format={{
                        format: "DD-MM-YYYY",
                        type: "mask",
                      }}
                      getPopupContainer={getModalContainer}
                      placeholder="dd-mm-yyyy"
                      suffixIcon={null}
                      value={appointmentDate}
                      onChange={(date) => setAppointmentDate(date)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Time <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon-end position-relative">
                    <TimePicker
                      className="form-control"
                      onChange={onChangeTime}
                      value={appointmentTime}
                      defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-clock" />
                    </span>
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <div>
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Appointment Reason
                    </label>
                    <textarea
                      rows={4}
                      className="form-control rounded"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* end col*/}
              <div className="col-lg-12">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Status<span className="text-danger">*</span>
                  </label>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="true"
                    >
                      {selectedStatus || "Select"}
                    </Link>
                    <div className="dropdown-menu shadow-lg w-100 dropdown-info">
                      <ul className="mb-3 list-style-none">
                        {["Checked Out", "Checked In", "Cancelled", "Schedule", "Scheduled", "Confirmed"].map((status) => (
                          <li key={status}>
                            <label
                              className="dropdown-item px-2 d-flex align-items-center text-dark"
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedStatus(status)}
                            >
                              <input
                                className="form-check-input m-0 me-2"
                                type="radio"
                                checked={selectedStatus === status}
                                onChange={() => {}}
                              />
                              {status}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col*/}
            </div>
            {/* end row*/}
            <div className="offcanvas-footer mb-1 mt-3 p-3 border-1 border-top">
              <div className=" d-flex justify-content-end gap-2">
                <Link
                  to="#"
                  className="btn btn-light btm-md"
                  onClick={(e) => {
                    e.preventDefault();
                    const offcanvas = document.getElementById("edit_appointment");
                    if (offcanvas) {
                      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                      if (bsOffcanvas) bsOffcanvas.hide();
                    }
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary btm-md"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Appointment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* End Edit New Appointment*/}
      {/* Start View Details */}
      <div
        className="offcanvas offcanvas-offset offcanvas-end"
        tabIndex={-1}
        id="view_details"
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">
              Appointment Details
              {viewAppointment && (
                <span className="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium ms-2">
                  #{String(viewAppointment._id || viewAppointment.id || "").slice(-6).toUpperCase()}
                </span>
              )}
            </h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x bg-white fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-0 px-0">
          {viewAppointment ? (
            <>
              <h6 className="bg-light py-2 px-3 text-dark fw-bold">
                When &amp; Where
              </h6>
              <div className="px-3 my-4">
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Appointment On
                  <span className="text-body fw-normal">{formatDateTime(viewAppointment.Date_Time)}</span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Time
                  <span className="text-body fw-normal">{formatTimeRange(viewAppointment.Date_Time)}</span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Location
                  <span className="text-body fw-normal">Clinic</span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Appointment Type
                  <span className="text-body fw-normal">
                    {viewAppointment.Mode === "Online" ? "Online Consultation" : "In-Person"}
                  </span>
                </p>
                <div className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Patient Details
                  <div className="text-body fw-normal d-flex align-items-center">
                    <span className="avatar avatar-sm">
                      <ImageWithBasePath
                        src={viewAppointment.Patient_Image || "assets/img/profiles/avatar-06.jpg"}
                        alt=""
                        className="rounded-circle me-1"
                      />
                    </span>
                    {viewAppointment.Patient}
                  </div>
                </div>
              </div>
              <h6 className="bg-light py-2 px-3 text-dark fw-bold">
                Appointment Details
              </h6>
              <div className="px-3 my-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    Telehealth
                    <label className="d-flex align-items-center form-switch ps-1">
                      <input
                        className="form-check-input m-0 me-2"
                        type="checkbox"
                        checked={viewAppointment.Mode === "Online"}
                        readOnly
                      />
                    </label>
                  </div>
                  {viewAppointment.Status !== "Checked Out" && viewAppointment.Status !== "Cancelled" && (
                    <div>
                      <Link
                        to={`${all_routes.onlineconsultations}?appointmentId=${viewAppointment._id || viewAppointment.id}`}
                        className="btn-primary btn btn-sm rounded d-flex align-items-center"
                      >
                        <i className="ti ti-video me-1" /> Start
                      </Link>
                    </div>
                  )}
                </div>
                <div className="row align-items-center">
                  <div className="col-lg-6 col-md-6">
                    <p className="text-dark"> Status </p>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <span
                      className={`badge ${
                        viewAppointment.Status === "Checked Out"
                          ? "badge-soft-primary"
                          : viewAppointment.Status === "Checked In"
                          ? "badge-soft-warning"
                          : viewAppointment.Status === "Cancelled"
                          ? "badge-soft-danger"
                          : "badge-soft-info"
                      } fw-medium`}
                    >
                      {viewAppointment.Status}
                    </span>
                  </div>
                </div>
                {viewAppointment.Reason && (
                  <div className="mt-3">
                    <p className="text-dark fw-semibold mb-2">Reason</p>
                    <p className="text-body">{viewAppointment.Reason}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-muted">Loading appointment details...</p>
            </div>
          )}
        </div>
      </div>
      {/* End View Details */}
    </>
  );
};

export default Modals;
