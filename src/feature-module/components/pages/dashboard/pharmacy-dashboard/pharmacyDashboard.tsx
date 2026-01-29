import { useState, useEffect, useCallback } from "react";
import {
  fetchPharmacyDashboard,
  fulfillPrescription,
  type PharmacyDashboardResponse,
  type PharmacyDashboardPrescription,
} from "../../../../../api/pharmacies";
import { useAuth } from "../../../../../core/context/AuthContext";

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

  const handleFulfillClick = (prescription: PharmacyDashboardPrescription) => {
    setSelectedPrescription(prescription);
    setAmountPaid("");
    setPaymentMode("Cash");
    setModalOpen(true);
  };

  const handleFulfillSubmit = async () => {
    if (!selectedPrescription) return;
    const id = selectedPrescription.id || selectedPrescription._id;
    const amount = parseFloat(amountPaid) || 0;
    try {
      setFulfillingId(id);
      await fulfillPrescription(id, { amountPaid: amount, paymentMode });
      setModalOpen(false);
      setSelectedPrescription(null);
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

  const { hospital, prescriptions, consultations } = data;

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

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0">Pending Prescriptions</h5>
                <span className="badge bg-primary">{prescriptions.length}</span>
              </div>
              <div className="card-body">
                {prescriptions.length === 0 ? (
                  <p className="text-muted mb-0">No pending prescriptions. All prescriptions for this hospital are dispensed or none exist.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th>Prescription ID</th>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Date</th>
                          <th>Medicines</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((p) => {
                          const meds = p.Medications?.length ? p.Medications : (p.Medicine ? [{ medicine: p.Medicine, dosage: p.Dosage, frequency: p.Frequency, duration: p.Duration }] : []);
                          const medText = meds.map((m) => (typeof m === "object" ? m.medicine : m)).filter(Boolean).join(", ") || "—";
                          return (
                            <tr key={p.id || p._id}>
                              <td>{p.Prescription_ID || p.id || "—"}</td>
                              <td>{p.Patient}</td>
                              <td>{p.Doctor}</td>
                              <td>{formatDate(p.Prescribed_On || p.Date || (p as any).createdAt)}</td>
                              <td className="text-truncate" style={{ maxWidth: "200px" }} title={medText}>{medText}</td>
                              <td><span className="badge bg-warning">{p.Status}</span></td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleFulfillClick(p)}
                                  disabled={!!fulfillingId}
                                >
                                  {fulfillingId === (p.id || p._id) ? (
                                    <span className="spinner-border spinner-border-sm me-1" />
                                  ) : null}
                                  Fulfill &amp; Take Cash
                                </button>
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
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="fw-bold mb-0">Recent Consultations (for reference)</h5>
              </div>
              <div className="card-body">
                {consultations.length === 0 ? (
                  <p className="text-muted mb-0">No completed consultations in this hospital yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="thead-light">
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
                          const medText = meds.map((m) => (typeof m === "object" ? m.medicine : m)).filter(Boolean).join(", ") || "—";
                          return (
                            <tr key={c.id || c._id}>
                              <td>{c.Patient}</td>
                              <td>{c.Doctor}</td>
                              <td>{formatDate((c as any).Completed_At || (c as any).createdAt)}</td>
                              <td className="text-truncate" style={{ maxWidth: "250px" }} title={medText}>{medText}</td>
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
        </div>
      </div>

      {/* Fulfill modal */}
      {modalOpen && selectedPrescription && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Fulfill Prescription &amp; Take Payment</h5>
                <button type="button" className="btn-close" onClick={() => { setModalOpen(false); setSelectedPrescription(null); }} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p className="mb-2"><strong>Patient:</strong> {selectedPrescription.Patient}</p>
                <p className="mb-2"><strong>Doctor:</strong> {selectedPrescription.Doctor}</p>
                <p className="mb-3"><strong>Prescription:</strong> {selectedPrescription.Prescription_ID || selectedPrescription.id}</p>
                <p className="small text-muted mb-3">Inventory will be deducted for each medicine linked to stock. Then mark as Dispensed.</p>
                <div className="mb-3">
                  <label className="form-label">Amount received (Cash/Card)</label>
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
                <div className="mb-3">
                  <label className="form-label">Payment mode</label>
                  <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Card")}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setModalOpen(false); setSelectedPrescription(null); }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleFulfillSubmit} disabled={!!fulfillingId}>
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
