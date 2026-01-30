import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchPharmacyDashboard,
  fulfillPrescription,
  fetchPrescriptionPriceBreakdown,
  type PharmacyDashboardResponse,
  type PharmacyDashboardPrescription,
  type PrescriptionPriceBreakdown,
} from "../../../../../api/pharmacies";
import { useAuth } from "../../../../../core/context/AuthContext";
import { all_routes } from "../../../../routes/all_routes";

type TabFilter = "all" | "pending" | "completed";

const PharmacyDashboard = () => {
  useAuth();
  const [data, setData] = useState<PharmacyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PharmacyDashboardPrescription | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card">("Cash");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("pending");
  const [priceBreakdown, setPriceBreakdown] = useState<PrescriptionPriceBreakdown | null>(null);
  const [priceBreakdownLoading, setPriceBreakdownLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPharmacyDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load pharmacy dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleFulfillClick = useCallback(
    async (prescription: PharmacyDashboardPrescription) => {
      setSelectedPrescription(prescription);
      setAmountPaid("");
      setPaymentMode("Cash");
      setPriceBreakdown(null);
      setModalOpen(true);
      const id = prescription.id || prescription._id;
      try {
        setPriceBreakdownLoading(true);
        const breakdown = await fetchPrescriptionPriceBreakdown(id);
        setPriceBreakdown(breakdown);
        setAmountPaid(breakdown.total > 0 ? String(breakdown.total) : "");
      } catch {
        setPriceBreakdown({ lineItems: [], total: 0 });
      } finally {
        setPriceBreakdownLoading(false);
      }
    },
    []
  );

  const handleFulfillSubmit = async () => {
    if (!selectedPrescription) return;
    const id = selectedPrescription.id || selectedPrescription._id;
    const amount = parseFloat(amountPaid) || 0;
    try {
      setFulfillingId(id);
      await fulfillPrescription(id, { amountPaid: amount, paymentMode });
      setModalOpen(false);
      setSelectedPrescription(null);
      setPriceBreakdown(null);
      await loadDashboard();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to fulfill prescription");
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

  const matchPrescription = useCallback(
    (p: PharmacyDashboardPrescription, q: string): boolean => {
      if (!q.trim()) return true;
      const lower = q.toLowerCase().trim();
      const patient = (p.Patient || "").toLowerCase();
      const doctor = (p.Doctor || "").toLowerCase();
      const prescId = (p.Prescription_ID || p.id || p._id || "").toString().toLowerCase();
      const meds = p.Medications?.length
        ? p.Medications.map((m) => (typeof m === "object" ? (m as { medicine?: string }).medicine : m)).filter(Boolean).join(" ")
        : (p.Medicine || "").toLowerCase();
      const medText = meds.toString().toLowerCase();
      return patient.includes(lower) || doctor.includes(lower) || prescId.includes(lower) || medText.includes(lower);
    },
    []
  );

  const filteredPrescriptions = useMemo(() => {
    if (!data) return { list: [] as PharmacyDashboardPrescription[], isPending: false };
    const pending = data.prescriptions || [];
    const completed = data.completedPrescriptions || [];
    let list: PharmacyDashboardPrescription[] = [];
    if (tabFilter === "pending") list = pending;
    else if (tabFilter === "completed") list = completed;
    else list = [...pending, ...completed].sort((a, b) => {
      const aDate = (a as any).updatedAt || (a as any).createdAt;
      const bDate = (b as any).updatedAt || (b as any).createdAt;
      return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
    });
    if (searchQuery.trim()) {
      list = list.filter((p) => matchPrescription(p, searchQuery));
    }
    const hasAnyPending = list.some((p) => p.Status !== "Dispensed" && p.Status !== "Completed");
    const hasAnyCompleted = list.some((p) => p.Status === "Dispensed" || p.Status === "Completed");
    return { list, hasAnyPending, hasAnyCompleted };
  }, [data, tabFilter, searchQuery, matchPrescription]);

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

  const { hospital, stats, consultations } = data;
  const { list: displayList, hasAnyPending, hasAnyCompleted } = filteredPrescriptions;
  const showActionColumn = hasAnyPending || hasAnyCompleted;

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

        {/* Prescriptions card: search + tabs + table */}
        <div className="card shadow-sm">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="fw-bold mb-0">Prescriptions</h5>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <ul className="nav nav-pills nav-pills-success mb-0">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "all" ? "active" : ""}`}
                    onClick={() => setTabFilter("all")}
                  >
                    All
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "pending" ? "active" : ""}`}
                    onClick={() => setTabFilter("pending")}
                  >
                    Pending
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabFilter === "completed" ? "active" : ""}`}
                    onClick={() => setTabFilter("completed")}
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
                  placeholder="Search patient, doctor, ID, medicine…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            {displayList.length === 0 ? (
              <p className="text-muted mb-0 py-4 text-center">
                {searchQuery.trim()
                  ? "No prescriptions match your search."
                  : tabFilter === "pending"
                    ? "No pending prescriptions."
                    : tabFilter === "completed"
                      ? "No completed prescriptions yet."
                      : "No prescriptions in this hospital."}
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Prescription ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Medicines</th>
                      <th>Status</th>
                      {showActionColumn && <th className="text-end">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((p) => {
                      const meds = p.Medications?.length
                        ? p.Medications
                        : p.Medicine
                          ? [{ medicine: p.Medicine, dosage: p.Dosage, frequency: p.Frequency, duration: p.Duration }]
                          : [];
                      const medText = meds
                        .map((m) => (typeof m === "object" ? (m as { medicine?: string }).medicine : m))
                        .filter(Boolean)
                        .join(", ") || "—";
                      const isDispensed = p.Status === "Dispensed" || p.Status === "Completed";
                      return (
                        <tr key={p.id || p._id}>
                          <td>
                            <span className="fw-medium">{p.Prescription_ID || p.id || "—"}</span>
                          </td>
                          <td>{p.Patient}</td>
                          <td>{p.Doctor}</td>
                          <td className="text-nowrap small">{formatDate(p.Prescribed_On || p.Date || (p as any).createdAt)}</td>
                          <td className="text-truncate" style={{ maxWidth: "200px" }} title={medText}>
                            {medText}
                          </td>
                          <td>
                            <span
                              className={`badge ${isDispensed ? "bg-success" : "bg-warning text-dark"}`}
                            >
                              {p.Status}
                            </span>
                          </td>
                          {showActionColumn && (
                            <td className="text-end">
                              {!isDispensed ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleFulfillClick(p)}
                                  disabled={!!fulfillingId}
                                >
                                  {fulfillingId === (p.id || p._id) ? (
                                    <span className="spinner-border spinner-border-sm me-1" />
                                  ) : null}
                                  Fulfill &amp; Take Payment
                                </button>
                              ) : (
                                <a
                                  href={`${all_routes.pharmacyInvoice}?id=${encodeURIComponent(p.id || p._id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline-success btn-sm d-inline-flex align-items-center"
                                >
                                  <i className="ti ti-file-invoice me-1" />
                                  Invoice / PDF
                                </a>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent consultations */}
        <div className="card shadow-sm mt-4">
          <div className="card-header">
            <h5 className="fw-bold mb-0">Recent Consultations (reference)</h5>
          </div>
          <div className="card-body">
            {consultations.length === 0 ? (
              <p className="text-muted mb-0">No completed consultations in this hospital yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Completed</th>
                      <th>Medications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.slice(0, 20).map((c) => {
                      const meds = c.Medications || [];
                      const medText = meds
                        .map((m) => (typeof m === "object" ? (m as { medicine?: string }).medicine : m))
                        .filter(Boolean)
                        .join(", ") || "—";
                      return (
                        <tr key={c.id || c._id}>
                          <td>{c.Patient}</td>
                          <td>{c.Doctor}</td>
                          <td className="text-nowrap small">{formatDate((c as any).Completed_At || (c as any).createdAt)}</td>
                          <td className="text-truncate" style={{ maxWidth: "250px" }} title={medText}>
                            {medText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fulfill modal */}
      {modalOpen && selectedPrescription && (
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
                    setSelectedPrescription(null);
                    setPriceBreakdown(null);
                  }}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body pt-2">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Patient:</strong> {selectedPrescription.Patient}</p>
                    <p className="mb-1"><strong>Doctor:</strong> {selectedPrescription.Doctor}</p>
                    <p className="mb-0"><strong>Prescription:</strong> {selectedPrescription.Prescription_ID || selectedPrescription.id}</p>
                  </div>
                </div>
                <p className="small text-muted mb-3">Inventory will be deducted for each medicine; then prescription will be marked Dispensed.</p>

                {priceBreakdownLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 mb-0 small">Loading prices from inventory…</p>
                  </div>
                ) : priceBreakdown && (priceBreakdown.lineItems.length > 0 || priceBreakdown.total > 0) ? (
                  <>
                    <div className="table-responsive mb-3">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th className="text-end">Unit Price</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceBreakdown.lineItems.map((line, idx) => (
                            <tr key={idx}>
                              <td>{line.medicine}</td>
                              <td>{line.dosage || "—"}</td>
                              <td className="text-end">{formatCurrency(line.unitPrice)}</td>
                              <td className="text-center">{line.quantity}</td>
                              <td className="text-end fw-medium">{formatCurrency(line.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan={4} className="text-end fw-bold">Total</td>
                            <td className="text-end fw-bold">{formatCurrency(priceBreakdown.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="small text-muted mb-2">Amount received is pre-filled from inventory prices. You can edit if needed.</p>
                  </>
                ) : priceBreakdown && !priceBreakdownLoading ? (
                  <p className="small text-warning mb-3">No inventory prices found for this prescription. Enter amount manually.</p>
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
                    setSelectedPrescription(null);
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
    </div>
  );
};

export default PharmacyDashboard;
