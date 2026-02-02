import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchInventoryReport,
  type InventoryReportResponse,
  type InventoryReportFilters,
  type DashboardPeriod,
} from "../../../../../api/dashboard";
import { all_routes } from "../../../../routes/all_routes";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "last6months", label: "Last 6 months" },
  { value: "all", label: "All" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const PharmacyInventoryReportPage = () => {
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<InventoryReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "in" | "out">("summary");

  const period = (searchParams.get("period") as DashboardPeriod) || "last30days";
  const [medicineSearch, setMedicineSearch] = useState(searchParams.get("search") || "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: InventoryReportFilters = { period };
      if (medicineSearch.trim()) filters.search = medicineSearch.trim();
      const res = await fetchInventoryReport(filters);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load inventory report");
    } finally {
      setLoading(false);
    }
  }, [period, medicineSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Pharmacy Inventory Report</h4>
            <p className="text-muted mb-0 fs-13">
              Stock in (GRN) and out (dispense) for your pharmacy
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search medicine..."
              style={{ width: 180 }}
              value={medicineSearch}
              onChange={(e) => setMedicineSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => load()}>
              <i className="ti ti-search me-1" /> Search
            </button>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={period}
              onChange={(e) => setFilter("period", e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Link to={all_routes.pharmacyReports} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-chart-bar me-1" /> Reports
            </Link>
            <Link to={all_routes.pharmacyTransactions} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-list me-1" /> Transactions
            </Link>
            <Link to={all_routes.pharmacyDashboard} className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> Dashboard
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 mb-0">Loading...</p>
          </div>
        )}

        {!loading && data && (
          <div className="card shadow-sm">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
                    onClick={() => setActiveTab("summary")}
                  >
                    Summary
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === "in" ? "active" : ""}`}
                    onClick={() => setActiveTab("in")}
                  >
                    In (GRN)
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === "out" ? "active" : ""}`}
                    onClick={() => setActiveTab("out")}
                  >
                    Out (Dispense)
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === "summary" && (
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-end">In (Qty)</th>
                        <th className="text-end">In (Value)</th>
                        <th>In Batch / Expiry</th>
                        <th className="text-end">Out (Qty)</th>
                        <th className="text-end">Out (Value)</th>
                        <th>Out Batch / Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summary.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            {data.search ? "No matches for this medicine." : "No data in this period."}
                          </td>
                        </tr>
                      ) : (
                        data.summary.map((row, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{row.itemName}</td>
                            <td className="text-end">{row.inQuantity}</td>
                            <td className="text-end">{formatCurrency(row.inValue)}</td>
                            <td className="small">
                              {row.inBatches?.length
                                ? row.inBatches.map((b, j) => (
                                    <div key={j}>Batch: {b.batch} · Expiry: {b.expiry} ({b.qty})</div>
                                  ))
                                : "—"}
                            </td>
                            <td className="text-end">{row.outQuantity}</td>
                            <td className="text-end">{formatCurrency(row.outValue)}</td>
                            <td className="small">
                              {row.outLines?.length
                                ? row.outLines.map((l, j) => (
                                    <div key={j}>Batch: {l.batch} · Expiry: {l.expiry} ({l.quantity})</div>
                                  ))
                                : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === "in" && (
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Value</th>
                        <th>Batch · Expiry (GRN)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.in.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            {data.search ? "No GRN matches for this medicine." : "No GRN receipts in this period."}
                          </td>
                        </tr>
                      ) : (
                        data.in.map((row, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{row.itemName}</td>
                            <td className="text-end">{row.quantity}</td>
                            <td className="text-end">{formatCurrency(row.value)}</td>
                            <td className="small">
                              {row.batches?.length
                                ? row.batches.map((b, j) => (
                                    <div key={j}>
                                      <strong>Batch:</strong> {b.batch} · <strong>Expiry:</strong> {b.expiry} · GRN: {b.grn} (Qty: {b.qty})
                                    </div>
                                  ))
                                : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === "out" && (
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.out.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            {data.search ? "No dispense matches for this medicine." : "No dispenses in this period."}
                          </td>
                        </tr>
                      ) : (
                        data.out.flatMap((row, i) =>
                          (row.lines && row.lines.length > 0
                            ? row.lines.map((l, j) => (
                                <tr key={`${i}-${j}`}>
                                  {j === 0 ? <td rowSpan={row.lines!.length} className="fw-medium align-middle">{row.itemName}</td> : null}
                                  <td>{l.batch}</td>
                                  <td>{l.expiry}</td>
                                  <td className="text-end">{l.quantity}</td>
                                  <td className="text-end">{formatCurrency(l.value)}</td>
                                </tr>
                              ))
                            : [
                                <tr key={i}>
                                  <td className="fw-medium">{row.itemName}</td>
                                  <td>—</td>
                                  <td>—</td>
                                  <td className="text-end">{row.quantity}</td>
                                  <td className="text-end">{formatCurrency(row.value)}</td>
                                </tr>,
                              ])
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyInventoryReportPage;
