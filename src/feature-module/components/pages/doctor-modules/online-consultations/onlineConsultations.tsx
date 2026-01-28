import { Link, useSearchParams, useNavigate } from "react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { empty_Stomach } from "../../../../../core/common/selectOption";
import ComplaintForm from "../../../../../core/common/dynamic-list/complientForm";
import DiagnosisForm from "../../../../../core/common/dynamic-list/diagnosisForm";
import MedicalForm from "../../../../../core/common/dynamic-list/medicalForm";
import AdviceForm from "../../../../../core/common/dynamic-list/AdviceForm";
import InvestigationList from "../../../../../core/common/dynamic-list/InvestigationForm";
import InvoiceList from "../../../../../core/common/dynamic-list/InvoiceList";
import {
  fetchAppointmentForConsultation,
  saveConsultation,
  type ConsultationData,
  type AppointmentWithPatient,
} from "../../../../../api/consultations";
import { all_routes } from "../../../../routes/all_routes";
import dayjs from "dayjs";

const OnlineConsultations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get("appointmentId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AppointmentWithPatient | null>(null);

  const [vitals, setVitals] = useState({
    temperature: "",
    pulse: "",
    respiratoryRate: "",
    spo2: "",
    height: "",
    weight: "",
    bmi: "",
    waist: "",
  });

  const [followUp, setFollowUp] = useState({
    nextConsultation: "",
    emptyStomach: "",
  });

  const [medications, setMedications] = useState<Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    // Inventory document id (MongoDB ObjectId as string)
    inventoryId?: string;
    // Optional inventory metadata
    inventoryCode?: string;
    inventoryCategory?: string;
    inventoryManufacturer?: string;
    inventoryStock?: number;
    inventoryStatus?: "Available" | "Low Stock" | "Out of Stock" | "Expired";
    inventoryUnit?: string;
    inventoryUnitPrice?: number;
  }>>([]);

  const [complaints, setComplaints] = useState<Array<{
    complaint: string;
    duration?: string;
  }>>([]);

  const [diagnosis, setDiagnosis] = useState<Array<{
    diagnosis: string;
    type?: string;
  }>>([]);

  const [advice, setAdvice] = useState<Array<{
    advice: string;
  }>>([]);

  const [investigations, setInvestigations] = useState<Array<{
    investigation: string;
    notes?: string;
  }>>([]);

  const [invoice, setInvoice] = useState<Array<{
    id: number;
    service: string;
    amount: string;
    paymentMode?: string;
  }>>([{ id: Date.now(), service: "", amount: "" }]);

  // Memoize MedicalForm value and onChange to prevent infinite loops
  const medicalFormValue = useMemo(
    () =>
      medications.map((med, idx) => ({
        id: idx,
        medicine: med.medicine,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        inventoryId: med.inventoryId,
        // Include inventory metadata
        inventoryCode: med.inventoryCode,
        inventoryCategory: med.inventoryCategory,
        inventoryManufacturer: med.inventoryManufacturer,
        inventoryStock: med.inventoryStock,
        inventoryStatus: med.inventoryStatus,
        inventoryUnit: med.inventoryUnit,
        inventoryUnitPrice: med.inventoryUnitPrice,
      })),
    [medications]
  );

  const handleMedicalFormChange = useCallback(
    (meds: Array<{
      id: number;
      medicine?: string;
      dosage?: string;
      dosageMg?: string;
      dosageM?: string;
      frequency?: string;
      duration?: string;
      inventoryId?: string;
      inventoryCode?: string;
      inventoryCategory?: string;
      inventoryManufacturer?: string;
      inventoryStock?: number;
      inventoryStatus?: "Available" | "Low Stock" | "Out of Stock" | "Expired";
      inventoryUnit?: string;
      inventoryUnitPrice?: number;
    }>) => {
      setMedications(
        meds.map((med) => ({
          medicine: med.medicine || "",
          dosage: med.dosage || med.dosageMg || med.dosageM || "",
          frequency: med.frequency || "",
          duration: med.duration || "",
          inventoryId: med.inventoryId,
          // Preserve inventory metadata
          inventoryCode: med.inventoryCode,
          inventoryCategory: med.inventoryCategory,
          inventoryManufacturer: med.inventoryManufacturer,
          inventoryStock: med.inventoryStock,
          inventoryStatus: med.inventoryStatus,
          inventoryUnit: med.inventoryUnit,
          inventoryUnitPrice: med.inventoryUnitPrice,
        }))
      );
    },
    []
  );

  // Fetch appointment and patient data
  useEffect(() => {
    const loadData = async () => {
      if (!appointmentId) {
        setError("Appointment ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchAppointmentForConsultation(appointmentId);
        setData(response);

        // Load existing consultation data if available
        if (response.appointment.Vitals) {
          setVitals(response.appointment.Vitals);
        }
        if (response.appointment.FollowUp) {
          setFollowUp(response.appointment.FollowUp);
        }
        if (response.appointment.Medications && Array.isArray(response.appointment.Medications)) {
          setMedications(response.appointment.Medications);
        }
        if (response.appointment.Complaints && Array.isArray(response.appointment.Complaints)) {
          setComplaints(response.appointment.Complaints);
        }
        if (response.appointment.Diagnosis && Array.isArray(response.appointment.Diagnosis)) {
          setDiagnosis(response.appointment.Diagnosis);
        }
        if (response.appointment.Advice && Array.isArray(response.appointment.Advice)) {
          setAdvice(response.appointment.Advice);
        }
        if (response.appointment.Investigations && Array.isArray(response.appointment.Investigations)) {
          setInvestigations(response.appointment.Investigations);
        }
        if (response.appointment.Invoice && Array.isArray(response.appointment.Invoice)) {
          // Convert invoice data to match InvoiceList format
          const invoiceData = response.appointment.Invoice.map((inv: any, idx: number) => ({
            id: Date.now() + idx,
            service: inv.item || inv.service || "",
            amount: inv.price?.toString() || inv.amount?.toString() || inv.total?.toString() || "",
            paymentMode: inv.paymentMode || "",
          }));
          if (invoiceData.length > 0) {
            setInvoice(invoiceData);
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load appointment data");
        // eslint-disable-next-line no-console
        console.error("Failed to load appointment:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId]);

  const validateConsultationData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate vitals (optional but if provided, should be valid)
    if (vitals.temperature && isNaN(parseFloat(vitals.temperature))) {
      errors.push("Temperature must be a valid number");
    }
    if (vitals.pulse && isNaN(parseFloat(vitals.pulse))) {
      errors.push("Pulse must be a valid number");
    }
    if (vitals.weight && isNaN(parseFloat(vitals.weight))) {
      errors.push("Weight must be a valid number");
    }
    if (vitals.height && isNaN(parseFloat(vitals.height))) {
      errors.push("Height must be a valid number");
    }

    // Validate medications (if provided, medicine name is required)
    const invalidMedications = medications.filter(
      (med) => med.medicine && med.medicine.trim() !== "" && !med.medicine.trim()
    );
    if (invalidMedications.length > 0) {
      errors.push("All medications must have a valid medicine name");
    }

    // Validate invoice (if provided, service and amount are required)
    const invalidInvoices = invoice.filter(
      (inv) => (inv.service && inv.service.trim() !== "") !== (inv.amount && inv.amount.trim() !== "")
    );
    if (invalidInvoices.length > 0) {
      errors.push("Invoice items must have both service and amount");
    }

    // Validate invoice amounts are numbers
    const invalidAmounts = invoice.filter(
      (inv) => inv.amount && inv.amount.trim() !== "" && isNaN(parseFloat(inv.amount))
    );
    if (invalidAmounts.length > 0) {
      errors.push("All invoice amounts must be valid numbers");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleCompleteAppointment = async () => {
    if (!appointmentId || !data) {
      alert("Missing appointment information. Please refresh the page.");
      return;
    }

    // Validate data before saving
    const validation = validateConsultationData();
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n${validation.errors.join("\n")}`);
      return;
    }

    if (!window.confirm("Are you sure you want to complete this appointment? This action cannot be undone.")) {
      return;
    }

    try {
      setSaving(true);
      
      // Format medications for API
      // Note: Backend only stores basic medication info (medicine, dosage, frequency, duration)
      // Inventory metadata (code, category, stock status) is stored client-side for display
      // but not sent to backend to maintain schema compatibility
      const formattedMedications = medications
        .filter((med) => med.medicine && med.medicine.trim() !== "")
        .map((med) => ({
          medicine: med.medicine.trim(),
          dosage: (med.dosage || "").trim(),
          frequency: (med.frequency || "").trim(),
          duration: (med.duration || "").trim(),
          inventoryId: med.inventoryId,
        }));

      // Format complaints for API
      const formattedComplaints = complaints
        .filter((comp) => comp.complaint && comp.complaint.trim() !== "")
        .map((comp) => ({
          complaint: comp.complaint.trim(),
          duration: (comp.duration || "").trim(),
        }));

      // Format diagnosis for API
      const formattedDiagnosis = diagnosis
        .filter((diag) => diag.diagnosis && diag.diagnosis.trim() !== "")
        .map((diag) => ({
          diagnosis: diag.diagnosis.trim(),
          type: (diag.type || "").trim(),
        }));

      // Format advice for API
      const formattedAdvice = advice
        .filter((adv) => adv.advice && adv.advice.trim() !== "")
        .map((adv) => ({
          advice: adv.advice.trim(),
        }));

      // Format investigations for API
      const formattedInvestigations = investigations
        .filter((inv) => inv.investigation && inv.investigation.trim() !== "")
        .map((inv) => ({
          investigation: inv.investigation.trim(),
          notes: (inv.notes || "").trim(),
        }));

      // Format invoice for API - convert from InvoiceList format to API format
      const formattedInvoice = invoice
        .filter((inv) => inv.service && inv.service.trim() !== "" && inv.amount && inv.amount.trim() !== "")
        .map((inv) => {
          const price = parseFloat(inv.amount) || 0;
          return {
            item: inv.service.trim(),
            quantity: 1,
            price: price,
            total: price,
            paymentMode: (inv.paymentMode || "").trim(),
          };
        });

      const consultationData: ConsultationData = {
        appointmentId,
        vitals: Object.keys(vitals).some((key) => vitals[key as keyof typeof vitals]) ? vitals : undefined,
        complaints: formattedComplaints.length > 0 ? formattedComplaints : undefined,
        diagnosis: formattedDiagnosis.length > 0 ? formattedDiagnosis : undefined,
        medications: formattedMedications.length > 0 ? formattedMedications : undefined,
        advice: formattedAdvice.length > 0 ? formattedAdvice : undefined,
        investigations: formattedInvestigations.length > 0 ? formattedInvestigations : undefined,
        followUp: Object.keys(followUp).some((key) => followUp[key as keyof typeof followUp]) ? followUp : undefined,
        invoice: formattedInvoice.length > 0 ? formattedInvoice : undefined,
      };

      // eslint-disable-next-line no-console
      console.log("[Frontend] Saving consultation data:", {
        appointmentId,
        vitals: consultationData.vitals,
        complaintsCount: consultationData.complaints?.length || 0,
        diagnosisCount: consultationData.diagnosis?.length || 0,
        medicationsCount: consultationData.medications?.length || 0,
        adviceCount: consultationData.advice?.length || 0,
        investigationsCount: consultationData.investigations?.length || 0,
        invoiceCount: consultationData.invoice?.length || 0,
        completeAppointment: true,
      });

      await saveConsultation(appointmentId, consultationData, true);
      alert("Appointment completed successfully!");
      navigate(all_routes.doctordashboard);
    } catch (err: any) {
      alert(`Failed to complete appointment: ${err?.response?.data?.message || err?.message || "Unknown error"}`);
      // eslint-disable-next-line no-console
      console.error("Failed to complete appointment:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return dayjs(dateTimeStr).format("DD MMM YYYY, hh:mm A");
    } catch {
      return dateTimeStr;
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper consultation-custom">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="mb-0">Loading consultation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrapper consultation-custom">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <p className="text-danger fw-semibold mb-3">{error || "Unable to load appointment data."}</p>
            <Link to={all_routes.doctordashboard} className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const appointment = data.appointment;
  const patient = data.patient;
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper consultation-custom">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">  Consultatiosns </h4>
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
          {/* Start Information */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Basic Information </h5>
            </div>
            {/* end card header */}
            <div className="card-body">
              {/* start row */}
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-xxxl">
                      <ImageWithBasePath
                        src={appointment.Patient_Image || patient?.Patient_Image || "assets/img/users/user-04.jpg"}
                        alt={appointment.Patient || "Patient"}
                        className="img-fluid img1 rounded"
                      />
                    </div>
                    <div className="">
                      <span className="badge badge-md text-info border border-info mb-1 fs-13 fw-medium px-2 ">
                        #{appointment.id || appointment._id || "N/A"}
                      </span>
                      <h5 className="text-dark mb-1 fw-bold">{appointment.Patient || "N/A"}</h5>
                      <p className="text-dark m-0">
                        <span className="text-body"> Reason : </span>{" "}
                        {appointment.Reason || "General Consultation"}
                      </p>
                    </div>
                  </div>
                </div>
                {/* end col */}
                <div className="col-lg-6">
                  <div className="bg-light p-3 rounded d-flex align-items-center justify-content-between">
                    {/* Items */}
                    <div>
                      <div className="mb-2">
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Age
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {patient?.Age || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Department
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {appointment.Department || "General"}
                        </p>
                      </div>
                    </div>
                    {/* Items */}
                    <div>
                      <div className="mb-2">
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Date
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {formatDateTime(appointment.Date_Time)}
                        </p>
                      </div>
                      <div>
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Gender
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {patient?.Gender || "N/A"}
                        </p>
                      </div>
                    </div>
                    {/* Items */}
                    <div>
                      <div className="mb-2">
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Blood Group
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {patient?.Blood_Group || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h6 className="text-dark fs-14 fw-semibold mb-1">
                          Consultation Type
                        </h6>
                        <p className="text-body fs-13 m-0">
                          {appointment.Mode || "In-Person"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end col */}
              </div>
              {/* end row */}
            </div>
            {/* end card body*/}
          </div>
          {/* end card */}
          {/* End Information */}
          {/* Start Vitals */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Vitals </h5>
            </div>
            {/* end card header */}
            <div className="card-body pb-0">
              {/* start form */}
              <form>
                {/* start row */}
                <div className="row">
                  {/* Items */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Temperature
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        F
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  {/* Items */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Pulse
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.pulse}
                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        mmHg
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  {/* Items */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Respiratory Rate
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.respiratoryRate}
                        onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        rpm
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      SPO2
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        %
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Height
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.height}
                        onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        cm
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Weight
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        kg
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      BMI
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.bmi}
                        onChange={(e) => setVitals({ ...vitals, bmi: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        %
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Waist
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={vitals.waist}
                        onChange={(e) => setVitals({ ...vitals, waist: e.target.value })}
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        cm
                      </span>
                    </div>
                  </div>
                  {/* end col */}
                </div>
                {/* end row */}
              </form>
              {/* end form */}
            </div>
          </div>
          {/* End Vitals */}
          {/* Start Complaint */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Complaint </h5>
            </div>
            {/* end card header */}
            <div className="card-body">
              <ComplaintForm 
                value={complaints}
                onChange={setComplaints}
              />
            </div>
            {/* end card-body */}
          </div>
          {/* end card-body */}
          {/* End Vitals */}
          {/* Start Diagnosis */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Diagnosis </h5>
            </div>
            {/* end card header */}
            <div className="card-body pb-0">
              <div className="">
                <DiagnosisForm 
                  value={diagnosis}
                  onChange={setDiagnosis}
                />
              </div>
            </div>
            {/* end card-body */}
          </div>
          {/* end card-body */}
          {/* End Complaint */}
          {/* Start Medication */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Medications </h5>
            </div>
            {/* end card header */}
            <div className="card-body pb-0">
              <MedicalForm
                value={medicalFormValue.length > 0 ? medicalFormValue : undefined}
                onChange={handleMedicalFormChange}
              />
            </div>
            {/* end card-body */}
          </div>
          {/* end card-body */}
          {/* End Medications */}
          {/* Start Advice */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Advice </h5>
            </div>
            {/* end card header */}
            <div className="card-body advices-list pb-0">
              <AdviceForm 
                value={advice}
                onChange={setAdvice}
              />
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
          {/* End Advice */}
          {/* Start Investigation */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Investigation &amp; Procedure </h5>
            </div>
            {/* end card header */}
            <div className="card-body invest-list pb-0">
              <InvestigationList 
                value={investigations}
                onChange={setInvestigations}
              />
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
          {/* End Advice */}
          {/* Start Follow Up */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Follow Up </h5>
            </div>
            {/* end card header */}
            <div className="card-body pb-0">
              {/* start row */}
              <div className="row">
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Next Consultation
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control rounded"
                        value={followUp.nextConsultation}
                        onChange={(e) => setFollowUp({ ...followUp, nextConsultation: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* end col */}
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label mb-1 text-dark fs-14 fw-medium">
                      Whether to come on empty Stomach
                    </label>
                    <CommonSelect
                      options={empty_Stomach}
                      className="select"
                      value={followUp.emptyStomach || empty_Stomach[0]?.value}
                      onChange={(value) => setFollowUp({ ...followUp, emptyStomach: value })}
                    />
                  </div>
                </div>
                {/* end col */}
              </div>
              {/* end row */}
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
          {/* End Follow Up */}
          {/* Start Invoice */}
          <div className="card rounded-0">
            <div className="card-header">
              <h5 className="m-0 fw-bold"> Invoice </h5>
            </div>
            {/* end card header */}
            <div className="card-body">
              <InvoiceList
                value={invoice}
                onChange={(items) => setInvoice(items)}
              />
            </div>
            {/* end card-body */}
          </div>
          {/* end card-body */}
          {/* End Complaint */}
          <div className="d-flex gap-2 align-items-center justify-content-end mb-4">
            <Link
              to={all_routes.doctordashboard}
              className="btn btn-md bg-light text-dark fs-13 fw-medium rounded"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="btn btn-md btn-primary fs-13 fw-medium rounded"
              onClick={handleCompleteAppointment}
              disabled={saving || appointment.Status === "Checked Out"}
            >
              {saving ? "Completing..." : "Complete Appointment"}
            </button>
          </div>
        </div>
        {/* End Content */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default OnlineConsultations;
