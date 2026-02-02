import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dayjs from "dayjs";
import {
  fetchPharmacyDashboard,
  fulfillConsultation,
  fetchConsultationPriceBreakdown,
  type PharmacyDashboardResponse,
  type PharmacyDashboardConsultation,
  type ConsultationPriceBreakdown,
  type ConsultationPriceLineItem,
} from "../../../../../api/pharmacies";
import { fetchConsultationById } from "../../../../../api/consultations";
import { useAuth } from "../../../../../core/context/AuthContext";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";

type TabFilter = "all" | "pending" | "completed";

const PAGE_SIZE = 10;

/** Printable prescription / medicine bill content for the pharmacy bill modal */
function BillModalBody({
  consultation,
  fulfilledBy,
  formatCurrency,
  formatDate,
}: {
  consultation: PharmacyDashboardConsultation & Record<string, any>;
  fulfilledBy: PharmacyDashboardConsultation["fulfilledBy"];
  formatCurrency: (n: number) => string;
  formatDate: (d: string | undefined) => string;
}) {
  const medicines = useMemo(() => {
    const meds = consultation.Medications;
    if (Array.isArray(meds) && meds.length > 0) return meds;
    return [];
  }, [consultation]);

  const prescribedOnLabel = useMemo(() => {
    const d = (consultation.Prescribed_On || consultation.Date || "") as string;
    if (!d) return "N/A";
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format("DD MMM YYYY") : d;
  }, [consultation.Prescribed_On, consultation.Date]);

  const prescriptionNo = consultation.Prescription_ID || consultation.Consultation_ID || consultation._id || consultation.id || "N/A";

  return (
    <div className="pharmacy-bill-print">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .modal, .modal * { visibility: visible !important; }
          .modal {
            position: fixed !important;
            inset: 0 !important;
            background: #fff !important;
            display: block !important;
            overflow: auto !important;
          }
          .modal-header, .modal .btn-close, .pharmacy-bill-print .bill-actions { display: none !important; }
          .modal-dialog { max-width: 100% !important; margin: 0 !important; }
          .modal-content { box-shadow: none !important; border: none !important; background: transparent !important; }
          .pharmacy-bill-print { padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; page-break-inside: avoid; }
          .table-responsive { overflow: visible !important; page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      <div className="card border shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
            <ImageWithBasePath src="assets/img/logo.svg" alt="" />
            <span className="badge bg-info-subtle text-info-emphasis fs-13 fw-medium border border-primary py-2 px-3">
              {prescriptionNo}
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar avatar-xxl rounded bg-light border p-2">
                <ImageWithBasePath src="./assets/img/icons/trust-care.svg" alt="" className="img-fluid" />
              </div>
              <div>
                <h6 className="text-dark fw-semibold mb-1">{consultation.Hospital_Name || "Clinic"}</h6>
                <p className="mb-1">{consultation.Doctor || "Doctor"}</p>
                <p className="mb-0 text-muted small">{consultation.role || ""}</p>
              </div>
            </div>
            <div className="text-lg-end">
              <p className="text-dark mb-1">Department : <span className="text-body">{consultation.Department || "N/A"}</span></p>
              <p className="text-dark mb-1">Prescribed on : <span className="text-body">{prescribedOnLabel}</span></p>
              <p className="text-dark mb-0">Consultation : <span className="text-body">{consultation.Consultation_ID || consultation.id || "N/A"}</span></p>
            </div>
          </div>
          <div className="mb-3">
            <h6 className="mb-2 fs-14 fw-medium">Patient Details</h6>
            <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h6 className="m-0 fw-semibold fs-16">{consultation.Patient || "N/A"}</h6>
              <span className="text-muted small">Patient ID: {consultation.patientId || "N/A"}</span>
            </div>
          </div>
          <div className="mb-4">
            <h6 className="mb-3 fs-16 fw-semibold text-center">Medicine Prescription</h6>
            <div className="table-responsive border bg-white">
              <table className="table table-nowrap align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-dark">#</th>
                    <th className="text-dark">Medicine Name</th>
                    <th className="text-dark">Dosage</th>
                    <th className="text-dark">Frequency</th>
                    <th className="text-dark">Duration</th>
                    <th className="text-dark">Timings</th>
                    <th className="text-dark">Batch</th>
                    <th className="text-dark">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-3">No medicines found.</td>
                    </tr>
                  ) : (
                    medicines.map((m: any, idx: number) => (
                      <tr key={`${m?.medicine || "med"}-${idx}`}>
                        <td>{String(idx + 1).padStart(2, "0")}</td>
                        <td>{m?.medicine || "N/A"}</td>
                        <td>{m?.dosage || "—"}</td>
                        <td>{m?.frequency || "—"}</td>
                        <td>{m?.duration || "—"}</td>
                        <td>{m?.timing || "—"}</td>
                        <td>{m?.batchNumber || "—"}</td>
                        <td>{m?.expiry ? (typeof m.expiry === "string" ? m.expiry : new Date(m.expiry).toISOString().slice(0, 10)) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pb-3 mb-3 border-bottom">
            <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
            <p className="mb-0">{consultation.AdviceText || "—"}</p>
          </div>
          <div className="pb-3 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="mb-1 fs-14 fw-semibold">Follow Up</h6>
              <p className="mb-0">{consultation.FollowUpText || "—"}</p>
            </div>
            <div>
              <ImageWithBasePath src="assets/img/icons/signature-img.svg" alt="" className="img-fluid" />
              <h6 className="fs-14 fw-semibold mt-1">{consultation.Doctor || "Doctor"}</h6>
            </div>
          </div>
          {fulfilledBy && (
            <div className="pb-3 mb-3 border-bottom bg-success bg-opacity-10 rounded p-3">
              <h6 className="mb-2 fs-14 fw-semibold text-success">Dispensed by Pharmacy</h6>
              <p className="mb-1"><strong>Amount received:</strong> {formatCurrency(fulfilledBy.amountReceived)}</p>
              <p className="mb-1"><strong>Payment:</strong> {fulfilledBy.paymentMethod || "—"}</p>
              <p className="mb-0 small text-muted">Dispensed at: {formatDate(fulfilledBy.dispensedAt)}</p>
            </div>
          )}
          <div className="text-center d-flex align-items-center justify-content-center flex-wrap gap-2 bill-actions mt-3">
            <button type="button" className="btn btn-md btn-dark d-flex align-items-center" onClick={() => window.print()}>
              <i className="ti ti-printer me-1" /> Print
            </button>
            <button type="button" className="btn btn-md btn-primary d-flex align-items-center" onClick={() => window.print()}>
              <i className="ti ti-download me-1" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PharmacyDashboard = () => {
  useAuth();
  const [data, setData] = useState<PharmacyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<PharmacyDashboardConsultation | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card">("Cash");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("pending");
  const [page, setPage] = useState(1);
  const [priceBreakdown, setPriceBreakdown] = useState<ConsultationPriceBreakdown | null>(null);
  const [priceBreakdownLoading, setPriceBreakdownLoading] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billRow, setBillRow] = useState<PharmacyDashboardConsultation | null>(null);
  const [billConsultation, setBillConsultation] = useState<(PharmacyDashboardConsultation & Record<string, any>) | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async (pageNum: number, search: string, tab: TabFilter) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPharmacyDashboard({
        page: pageNum,
        limit: PAGE_SIZE,
        search: search || undefined,
        tab,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load pharmacy dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(page, searchParam, tabFilter);
  }, [page, searchParam, tabFilter, loadDashboard]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchParam(searchQuery);
      setPage(1);
      searchDebounceRef.current = null;
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleTabChange = useCallback((tab: TabFilter) => {
    setTabFilter(tab);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleFulfillClick = useCallback(async (consultation: PharmacyDashboardConsultation) => {
    setSelectedConsultation(consultation);
    setAmountPaid("");
    setPaymentMode("Cash");
    setPriceBreakdown(null);
    setModalOpen(true);
    const id = consultation.id || consultation._id;
    try {
      setPriceBreakdownLoading(true);
      const breakdown = await fetchConsultationPriceBreakdown(id);
      setPriceBreakdown(breakdown);
      setAmountPaid(breakdown.total > 0 ? String(breakdown.total) : "");
    } catch {
      setPriceBreakdown({ lineItems: [], total: 0 });
    } finally {
      setPriceBreakdownLoading(false);
    }
  }, []);

  const updateLineItemQty = useCallback((index: number, quantity: number) => {
    if (!priceBreakdown) return;
    const qty = Math.max(1, quantity);
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, quantity: qty, subtotal: line.unitPrice * qty } : line
    );
    const total = next.reduce((sum, l) => sum + l.subtotal, 0);
    setPriceBreakdown({ lineItems: next, total });
    setAmountPaid(String(total));
  }, [priceBreakdown]);

  const updateLineItemUnitPrice = useCallback((index: number, unitPrice: number) => {
    if (!priceBreakdown) return;
    const price = Math.max(0, unitPrice);
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, unitPrice: price, subtotal: price * line.quantity } : line
    );
    const total = next.reduce((sum, l) => sum + l.subtotal, 0);
    setPriceBreakdown({ lineItems: next, total });
    setAmountPaid(String(total));
  }, [priceBreakdown]);

  const updateLineItemMedicine = useCallback((index: number, medicine: string) => {
    if (!priceBreakdown) return;
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, medicine } : line
    );
    setPriceBreakdown({ ...priceBreakdown, lineItems: next });
  }, [priceBreakdown]);

  const updateLineItemDosage = useCallback((index: number, dosage: string) => {
    if (!priceBreakdown) return;
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, dosage } : line
    );
    setPriceBreakdown({ ...priceBreakdown, lineItems: next });
  }, [priceBreakdown]);

  const updateLineItemExpiry = useCallback((index: number, expiry: string) => {
    if (!priceBreakdown) return;
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, expiry: expiry || undefined } : line
    );
    setPriceBreakdown({ ...priceBreakdown, lineItems: next });
  }, [priceBreakdown]);

  const updateLineItemBatch = useCallback((index: number, batchNumber: string) => {
    if (!priceBreakdown) return;
    const next = priceBreakdown.lineItems.map((line, i) =>
      i === index ? { ...line, batchNumber: batchNumber || undefined } : line
    );
    setPriceBreakdown({ ...priceBreakdown, lineItems: next });
  }, [priceBreakdown]);

  const addMedicineLine = useCallback(() => {
    const newLine: ConsultationPriceLineItem = {
      medicine: "",
      dosage: "",
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      batchNumber: "",
      expiry: "",
    };
    setPriceBreakdown((prev) => {
      if (!prev) return { lineItems: [newLine], total: 0 };
      const next = [...prev.lineItems, newLine];
      const total = next.reduce((sum, l) => sum + l.subtotal, 0);
      return { lineItems: next, total };
    });
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setPriceBreakdown((prev) => {
      if (!prev) return { lineItems: [], total: 0 };
      const next = prev.lineItems.filter((_, i) => i !== index);
      const total = next.reduce((sum, l) => sum + l.subtotal, 0);
      setAmountPaid(String(total));
      return { lineItems: next, total };
    });
  }, []);

  const handleViewBillClick = useCallback(async (consultation: PharmacyDashboardConsultation) => {
    const id = consultation.id || consultation._id;
    setBillRow(consultation);
    setBillConsultation(null);
    setBillError(null);
    setBillModalOpen(true);
    try {
      setBillLoading(true);
      const data = await fetchConsultationById(id);
      setBillConsultation(data as PharmacyDashboardConsultation & Record<string, any>);
    } catch (err: any) {
      setBillError(err?.response?.data?.message || err?.message || "Failed to load prescription");
    } finally {
      setBillLoading(false);
    }
  }, []);

  const handleCloseBillModal = useCallback(() => {
    setBillModalOpen(false);
    setBillRow(null);
    setBillConsultation(null);
    setBillError(null);
  }, []);

  const handleFulfillSubmit = async () => {
    if (!selectedConsultation) return;
    const id = selectedConsultation.id || selectedConsultation._id;
    const amount = parseFloat(amountPaid) || 0;
    const lineItems = priceBreakdown?.lineItems?.filter((l) => String(l.medicine ?? "").trim()).map((l) => ({
      medicine: l.medicine.trim(),
      dosage: l.dosage ?? "",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subtotal: l.subtotal,
      inventoryId: l.inventoryId,
      batchNumber: l.batchNumber && String(l.batchNumber).trim() ? String(l.batchNumber).trim() : undefined,
      expiry: l.expiry && String(l.expiry).trim() ? String(l.expiry).trim() : undefined,
    }));
    if (priceBreakdown?.lineItems?.length && (!lineItems || lineItems.length === 0)) {
      alert("Enter at least one medicine name.");
      return;
    }
    const missingBatchOrExpiry = lineItems?.find((l) => !l.batchNumber?.trim() || !l.expiry?.trim());
    if (missingBatchOrExpiry) {
      alert("Batch number and expiry date are required for every medicine. Please fill them for: " + (missingBatchOrExpiry.medicine || "all lines"));
      return;
    }
    try {
      setFulfillingId(id);
      await fulfillConsultation(id, { amountReceived: amount, paymentMode, lineItems });
      setModalOpen(false);
      setSelectedConsultation(null);
      setPriceBreakdown(null);
      await loadDashboard(page, searchParam, tabFilter);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to fulfill");
    } finally {
      setFulfillingId(null);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return d;
    }
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading pharmacy dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="alert alert-danger" role="alert">
            {error || "Failed to load pharmacy dashboard"}
          </div>
        </div>
      </div>
    );
  }

  const { hospital, stats, consultations: displayList = [], pagination: paginationInfo } = data;
  const showActionColumn = displayList.length > 0;

  return (
    <div className="page-wrapper">
      <div className="content pb-0">
        <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-0">Pharmacy Dashboard</h4>
            {hospital && (
              <p className="text-muted mb-0 fs-13">
                <i className="ti ti-building-hospital me-1" />
                {hospital.name}
                {hospital.city && hospital.state && (
                  <span className="ms-2">({hospital.city}, {hospital.state})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-4">
            <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
              <div className="card-body d-flex align-items-center">
                <div className="flex-shrink-0 rounded-circle bg-primary bg-opacity-25 p-3 me-3">
                  <i className="ti ti-pill text-primary fs-4" />
                </div>
                <div>
                  <h6 className="text-muted mb-1 small text-uppercase">Pending</h6>
                  <h4 className="fw-bold mb-0">{stats?.pendingCount ?? 0}</h4>
                  <span className="small text-muted">Awaiting fulfillment</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-4">
            <div className="card border-0 shadow-sm bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center">
                <div className="flex-shrink-0 rounded-circle bg-success bg-opacity-25 p-3 me-3">
                  <i className="ti ti-check text-success fs-4" />
                </div>
                <div>
                  <h6 className="text-muted mb-1 small text-uppercase">Completed Today</h6>
                  <h4 className="fw-bold mb-0">{stats?.completedTodayCount ?? 0}</h4>
                  <span className="small text-muted">Dispensed today</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-4">
            <div className="card border-0 shadow-sm bg-info bg-opacity-10">
              <div className="card-body d-flex align-items-center">
                <div className="flex-shrink-0 rounded-circle bg-info bg-opacity-25 p-3 me-3">
                  <i className="ti ti-clipboard-list text-info fs-4" />
                </div>
                <div>
                  <h6 className="text-muted mb-1 small text-uppercase">Total Completed</h6>
                  <h4 className="fw-bold mb-0">{stats?.completedCount ?? 0}</h4>
                  <span className="small text-muted">All time (recent)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consultations (from Consultation table): search + tabs + table */}
        <div className="card shadow-sm">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="fw-bold mb-0">Consultations</h5>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <ul className="nav nav-pills nav-pills-success mb-0">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "all" ? "active" : ""}`}
                    onClick={() => handleTabChange("all")}
                  >
                    All
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "pending" ? "active" : ""}`}
                    onClick={() => handleTabChange("pending")}
                  >
                    Pending
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "completed" ? "active" : ""}`}
                    onClick={() => handleTabChange("completed")}
                  >
                    Completed
                  </button>
                </li>
              </ul>
              <div className="input-group input-group-sm" style={{ minWidth: "220px" }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search patient, doctor, medicine…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search prescriptions"
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            {displayList.length === 0 ? (
              <p className="text-muted mb-0 py-4 text-center">
                {searchQuery.trim()
                  ? "No consultations match your search."
                  : tabFilter === "pending"
                    ? "No pending consultations to dispense."
                    : tabFilter === "completed"
                      ? "No dispensed consultations yet."
                      : "No completed consultations in this hospital."}
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Consultation ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Medicines</th>
                      <th>Status</th>
                      {showActionColumn && <th className="text-end">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((c) => {
                      const meds = c.Medications || [];
                      const medText = meds
                        .map((m) => (typeof m === "object" ? (m as { medicine?: string }).medicine : m))
                        .filter(Boolean)
                        .join(", ") || "—";
                      const isDispensed = !!c.fulfilledBy;
                      return (
                        <tr key={c.id || c._id}>
                          <td>
                            <span className="fw-medium">{c.Consultation_ID || c.id || "—"}</span>
                          </td>
                          <td>{c.Patient}</td>
                          <td>{c.Doctor}</td>
                          <td className="text-nowrap small">{formatDate((c as any).Completed_At || (c as any).Consultation_Date || (c as any).createdAt)}</td>
                          <td className="text-truncate" style={{ maxWidth: "200px" }} title={medText}>
                            {medText}
                          </td>
                          <td>
                            {isDispensed ? (
                              <span className="badge bg-success">
                                Dispensed {c.fulfilledBy?.amountReceived != null ? formatCurrency(c.fulfilledBy.amountReceived) : ""}
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark">Pending</span>
                            )}
                          </td>
                          {showActionColumn && (
                            <td className="text-end">
                              <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                                {!isDispensed && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleFulfillClick(c)}
                                    disabled={!!fulfillingId}
                                  >
                                    {fulfillingId === (c.id || c._id) ? (
                                      <span className="spinner-border spinner-border-sm me-1" />
                                    ) : null}
                                    Fulfill &amp; Take Payment
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-outline-dark btn-sm d-flex align-items-center"
                                  onClick={() => handleViewBillClick(c)}
                                  title="View prescription &amp; print / download bill"
                                >
                                  <i className="ti ti-file-invoice me-1" />
                                  View &amp; Print Bill
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {displayList.length > 0 && paginationInfo && paginationInfo.pages > 1 && (
              <nav className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-3 border-top">
                <div className="small text-muted">
                  Showing {(paginationInfo.page - 1) * paginationInfo.limit + 1}–
                  {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)} of {paginationInfo.total}
                </div>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${paginationInfo.page <= 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(paginationInfo.page - 1)}
                      disabled={paginationInfo.page <= 1}
                      aria-label="Previous"
                    >
                      Previous
                    </button>
                  </li>
                  {(() => {
                    const curr = paginationInfo.page;
                    const pages = paginationInfo.pages;
                    const show: (number | "ellipsis")[] = [];
                    for (let p = 1; p <= pages; p++) {
                      if (p === 1 || p === pages || (p >= curr - 2 && p <= curr + 2)) show.push(p);
                      else if (show[show.length - 1] !== "ellipsis") show.push("ellipsis");
                    }
                    return show.map((item, i) =>
                      item === "ellipsis" ? (
                        <li key={`e-${i}`} className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      ) : (
                        <li key={item} className={`page-item ${item === curr ? "active" : ""}`}>
                          <button type="button" className="page-link" onClick={() => handlePageChange(item)}>
                            {item}
                          </button>
                        </li>
                      )
                    );
                  })()}
                  <li className={`page-item ${paginationInfo.page >= paginationInfo.pages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(paginationInfo.page + 1)}
                      disabled={paginationInfo.page >= paginationInfo.pages}
                      aria-label="Next"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>

      </div>

      {/* Fulfill modal */}
      {modalOpen && selectedConsultation && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Fulfill Prescription &amp; Take Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedConsultation(null);
                    setPriceBreakdown(null);
                  }}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body pt-2">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Patient:</strong> {selectedConsultation.Patient}</p>
                    <p className="mb-1"><strong>Doctor:</strong> {selectedConsultation.Doctor}</p>
                    <p className="mb-0"><strong>Consultation ID:</strong> {selectedConsultation.Consultation_ID || selectedConsultation.id}</p>
                  </div>
                </div>
                <p className="small text-muted mb-3">Edit medicine, dosage, unit price, quantity and expiry as needed. Add or remove lines; inventory will be deducted on submit.</p>

                {priceBreakdownLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 mb-0 small">Loading prices from inventory…</p>
                  </div>
                ) : priceBreakdown ? (
                  <>
                    <div className="table-responsive mb-2">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th className="text-end">Unit Price (₹)</th>
                            <th className="text-center">Qty</th>
                            <th>Batch <span className="text-danger">*</span></th>
                            <th>Expiry <span className="text-danger">*</span></th>
                            <th className="text-end">Subtotal</th>
                            <th className="text-center" style={{ width: "4rem" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceBreakdown.lineItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-muted text-center py-3 small">
                                No lines. Click &quot;Add medicine&quot; to add.
                              </td>
                            </tr>
                          ) : (
                            priceBreakdown.lineItems.map((line, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Medicine name"
                                    value={line.medicine}
                                    onChange={(e) => updateLineItemMedicine(idx, e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Dosage"
                                    value={line.dosage ?? ""}
                                    onChange={(e) => updateLineItemDosage(idx, e.target.value)}
                                  />
                                </td>
                                <td className="text-end">
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="form-control form-control-sm text-end"
                                    style={{ width: "5rem" }}
                                    value={line.unitPrice}
                                    onChange={(e) => updateLineItemUnitPrice(idx, parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control form-control-sm d-inline-block text-center"
                                    style={{ width: "4rem" }}
                                    value={line.quantity}
                                    onChange={(e) => updateLineItemQty(idx, parseInt(e.target.value, 10) || 1)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Batch no."
                                    value={line.batchNumber ?? ""}
                                    onChange={(e) => updateLineItemBatch(idx, e.target.value)}
                                    title="Required"
                                  />
                                  {!line.batchNumber?.trim() && (
                                    <span className="d-block small text-warning">Required</span>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={line.expiry ?? ""}
                                    onChange={(e) => updateLineItemExpiry(idx, e.target.value)}
                                    title="Required"
                                  />
                                  {!line.expiry && (
                                    <span className="d-block small text-warning">Required</span>
                                  )}
                                </td>
                                <td className="text-end fw-medium align-middle">{formatCurrency(line.subtotal)}</td>
                                <td className="text-center align-middle">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeLineItem(idx)}
                                    title="Remove line"
                                    aria-label="Remove line"
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan={7} className="text-end fw-bold">Total</td>
                            <td className="text-end fw-bold">{formatCurrency(priceBreakdown.total)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="mb-3">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={addMedicineLine}>
                        <i className="ti ti-plus me-1" /> Add medicine
                      </button>
                    </div>
                    <p className="small text-muted mb-2">Expiry is shown from inventory when available; otherwise provide a date. Amount received is pre-filled from total; edit as needed.</p>
                  </>
                ) : null}

                <div className="mb-3">
                  <label className="form-label fw-medium">Amount received</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-medium">Payment mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Card")}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedConsultation(null);
                    setPriceBreakdown(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFulfillSubmit}
                  disabled={!!fulfillingId}
                >
                  {fulfillingId ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  Fulfill &amp; Deduct Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill / Prescription modal: view & print / download */}
      {billModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} aria-modal>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Prescription &amp; Medicine Bill</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseBillModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body pt-2">
                {billLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 mb-0 small">Loading prescription…</p>
                  </div>
                ) : billError ? (
                  <div className="text-center py-4">
                    <p className="text-danger fw-medium mb-3">{billError}</p>
                    <button type="button" className="btn btn-primary" onClick={handleCloseBillModal}>
                      Close
                    </button>
                  </div>
                ) : billConsultation ? (
                  <BillModalBody
                    consultation={billConsultation}
                    fulfilledBy={billRow?.fulfilledBy}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
