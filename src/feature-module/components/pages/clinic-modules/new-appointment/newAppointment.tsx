import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import {
  Appointment_Type,
  Department,
  Status_Checkout,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import { useState, useEffect, useMemo } from "react";
import Modals from "./modals/modals";
import { createAppointment, type Appointment } from "../../../../../api/appointments";
import { fetchDoctors, type Doctor } from "../../../../../api/doctors";
import { fetchPatients, type Patient } from "../../../../../api/patients";
import type { Option } from "../../../../../core/common/common-select/commonSelect";
import TimeSlotPicker from "../../../../../core/common/time-slot-picker/TimeSlotPicker";
import { useAuth } from "../../../../../core/context/AuthContext";

const PAYMENT_MODES = [
  { value: "Cash", label: "Cash" },
  { value: "Card", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "Online", label: "Online" },
];

const NewAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>(""); // HH:mm format
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [formData, setFormData] = useState({
    Patient: "",
    Department: "",
    Doctor: "",
    Appointment_Type: "",
    Date: null as Dayjs | null,
    Reason: "",
    Status: "",
  });


  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctorsRes, patientsRes] = await Promise.all([
          fetchDoctors({ limit: 100, sort: "Name_Designation" }),
          fetchPatients({ limit: 100, sort: "Patient" }),
        ]);

        const doctorsList = Array.isArray(doctorsRes) ? doctorsRes : doctorsRes.data || [];
        const patientsList = Array.isArray(patientsRes) ? patientsRes : patientsRes.data || [];

        setDoctors(doctorsList);
        setPatients(patientsList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load doctors/patients:", error);
        alert("Failed to load doctors and patients. Please refresh the page.");
      }
    };

    loadData();
  }, []);

  const doctorOptions: Option[] = useMemo(
    () =>
      doctors.map((doc) => ({
        value: doc.Name_Designation || doc.Doctor || "",
        label: doc.Name_Designation || doc.Doctor || "",
      })),
    [doctors]
  );

  const patientOptions: Option[] = useMemo(
    () =>
      patients.map((pat) => ({
        value: pat.Patient || "",
        label: pat.Patient || "",
      })),
    [patients]
  );

  // Get selected doctor's ID and hospital ID
  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.Name_Designation === formData.Doctor);
  }, [doctors, formData.Doctor]);

  const doctorId = selectedDoctor?._id || selectedDoctor?.id || "";
  const hospitalId = user?.hospitalId || selectedDoctor?.hospital;

  const consultationFee = useMemo(() => {
    if (!selectedDoctor?.Fees) return 0;
    const fee = parseFloat(String(selectedDoctor.Fees));
    return isNaN(fee) ? 0 : fee;
  }, [selectedDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.Patient ||
      !formData.Doctor ||
      !formData.Appointment_Type ||
      !formData.Date ||
      !selectedSlotTime ||
      !formData.Status
    ) {
      alert("Please fill in all required fields including selecting a time slot");
      return;
    }

    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0) {
      alert("Please enter a valid amount paid.");
      return;
    }
    if (paid < consultationFee) {
      alert(`Consultation fee is ${consultationFee}. Amount paid must be at least the consultation fee.`);
      return;
    }
    if (!paymentMode || paymentMode === "Select") {
      alert("Please select a payment mode.");
      return;
    }

    try {
      setLoading(true);

      // Find selected patient to get phone number
      const selectedPatient = patients.find((p) => p.Patient === formData.Patient);
      if (!selectedPatient) {
        alert("Selected patient not found");
        return;
      }

      if (!selectedDoctor) {
        alert("Selected doctor not found");
        return;
      }

      // Combine date and selected slot time
      const [hour, minute] = selectedSlotTime.split(":").map(Number);
      const dateTime = formData.Date.hour(hour).minute(minute).second(0);

      const appointmentData: Partial<Appointment> = {
        Date_Time: dateTime.format("DD MMM YYYY, hh:mm A"),
        // Normalized fields for backend conflict prevention + reliable booked-slot display
        appointmentDate: formData.Date.format("YYYY-MM-DD"),
        slotTime: selectedSlotTime,
        dateTimeIso: dateTime.toISOString(),
        Patient: formData.Patient,
        Phone: selectedPatient.Phone || "",
        Doctor: formData.Doctor,
        doctorId: selectedDoctor._id || selectedDoctor.id, // Save doctor's _id
        Mode: formData.Appointment_Type,
        Status: formData.Status,
        // Additional fields
        role: selectedDoctor.role || "",
        Department: formData.Department || selectedDoctor.Department || "",
        Reason: formData.Reason || "",
        // Pay-first: payment collected at reception when booking
        amountPaid: paid,
        paymentMode,
      };

      await createAppointment(appointmentData);
      alert("Appointment created successfully!");
      navigate(all_routes.appointments);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to create appointment:", error);
      alert(
        `Failed to create appointment: ${
          error?.response?.data?.message || error?.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCreated = async () => {
    // Reload patients after new patient is created
    try {
      const patientsRes = await fetchPatients({ limit: 100, sort: "Patient" });
      const patientsList = Array.isArray(patientsRes) ? patientsRes : patientsRes.data || [];
      setPatients(patientsList);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to reload patients:", error);
    }
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* row start */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* page header start */}
              <div className="mb-4">
                <h6 className="fw-bold mb-0 d-flex align-items-center">
                  <Link to={all_routes.appointments} className="text-dark">
                    <i className="ti ti-chevron-left me-1" />
                    Appointments
                  </Link>
                </h6>
              </div>
              {/* page header end */}
              {/* card start */}
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Appointment ID is auto-generated by MongoDB */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label mb-0 fw-medium">
                              Patient<span className="text-danger ms-1">*</span>
                            </label>
                            <Link
                              to="#"
                              className="link-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#add_modal"
                            >
                              <i className="ti ti-circle-plus me-1" />
                              Add New
                            </Link>
                          </div>
                          <CommonSelect
                            options={patientOptions}
                            className="select"
                            value={formData.Patient}
                            onChange={(value) => setFormData({ ...formData, Patient: value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Department
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Department}
                            className="select"
                            value={formData.Department}
                            onChange={(value) => setFormData({ ...formData, Department: value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Doctor<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={doctorOptions}
                            className="select"
                            value={formData.Doctor}
                            onChange={(value) => setFormData({ ...formData, Doctor: value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Appointment Type
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Appointment_Type}
                            className="select"
                            value={formData.Appointment_Type}
                            onChange={(value) =>
                              setFormData({ ...formData, Appointment_Type: value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Date of Appointment
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format={{
                                format: "DD-MM-YYYY",
                                type: "mask",
                              }}
                              getPopupContainer={getModalContainer}
                              placeholder="DD-MM-YYYY"
                              suffixIcon={null}
                              value={formData.Date}
                              onChange={(date) => setFormData({ ...formData, Date: date })}
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Time Slot<span className="text-danger ms-1">*</span>
                          </label>
                          {formData.Doctor && formData.Date ? (
                            <TimeSlotPicker
                              doctorId={doctorId}
                              date={formData.Date}
                              hospitalId={hospitalId}
                              value={selectedSlotTime}
                              onChange={setSelectedSlotTime}
                              disabled={loading}
                            />
                          ) : (
                            <div className="alert alert-info mb-0">
                              <i className="ti ti-info-circle me-2" />
                              Please select a doctor and date to view available time slots.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedSlotTime && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-success mb-3">
                            <i className="ti ti-check me-2" />
                            Selected time: <strong>{selectedSlotTime}</strong> on{" "}
                            <strong>{formData.Date?.format("DD MMM YYYY")}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Appointment Reason
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.Reason}
                        onChange={(e) => setFormData({ ...formData, Reason: e.target.value })}
                        placeholder="Enter appointment reason"
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label mb-1 fw-medium">
                        Status<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={Status_Checkout}
                        className="select"
                        value={formData.Status}
                        onChange={(value) => setFormData({ ...formData, Status: value })}
                      />
                    </div>
                    {/* Pay-first: payment collected at reception when booking */}
                    <div className="card bg-light border-0 mt-4 mb-0">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">
                          <i className="ti ti-currency-rupee me-1" />
                          Payment (pay first to confirm booking)
                        </h6>
                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium text-muted">
                                Consultation fee
                              </label>
                              <div className="form-control bg-white">
                                {selectedDoctor
                                  ? `₹${consultationFee.toLocaleString()}`
                                  : "Select doctor"}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">
                                Amount paid<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                min={0}
                                step={1}
                                placeholder="0"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label className="form-label mb-1 fw-medium">
                                Payment mode<span className="text-danger ms-1">*</span>
                              </label>
                              <CommonSelect
                                options={PAYMENT_MODES}
                                className="select"
                                value={paymentMode}
                                onChange={(value) => setPaymentMode(value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  <div className="d-flex align-items-center justify-content-end mt-4">
                    <Link to={all_routes.appointments} className="btn btn-light me-2">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Appointment"}
                    </button>
                  </div>
                </form>
              </div>
              {/* card end */}
            </div>
          </div>
          {/* row end */}
        </div>
        {/* End Content */}
        </div>
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2026©
            <Link to="#" className="link-primary">
              Zaptas
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals onPatientCreated={handlePatientCreated} />
    </>
  );
};

export default NewAppointment;
