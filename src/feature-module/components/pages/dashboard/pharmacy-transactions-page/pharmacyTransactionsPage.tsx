import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchTransactions,
  type TransactionItem,
  type TransactionsFilters,
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

const TYPES = [
  { value: "pharmacy", label: "Pharmacy only" },
  { value: "all", label: "All (Branch)" },
  { value: "hospital", label: "Consultation only" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dateStr;
  }
};

const PharmacyTransactionsPage = () => {
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<{
    list: TransactionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = (searchParams.get("period") as DashboardPeriod) || "last30days";
  const type = (searchParams.get("type") as "all" | "hospital" | "pharmacy") || "pharmacy";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: TransactionsFilters = {
        period,
        type,
        page,
        limit: 20,
      };
      const res = await fetchTransactions(filters);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [period, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    if (key === "page") next.set("page", value);
    else next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Pharmacy Transactions</h4>
            <p className="text-muted mb-0 fs-13">
              Sales & payment history — dispensed prescriptions and consultation fees
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link to={all_routes.pharmacyReports} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-chart-bar me-1" /> Reports
            </Link>
            <Link to={all_routes.pharmacyInventoryReport} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-package me-1" /> Inventory report
            </Link>
            <Link to={all_routes.pharmacyDashboard} className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-layout-dashboard me-1" /> Dashboard
            </Link>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="mb-0">Transaction list</h5>
            <div className="d-flex align-items-center flex-wrap gap-2">
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
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={type}
                onChange={(e) => setFilter("type", e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="mt-2 mb-0">Loading...</p>
              </div>
            )}
            {!loading && data && (
              <>
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th>Reference</th>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.list.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            No transactions in this period.
                          </td>
                        </tr>
                      ) : (
                        data.list.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <span className="fw-medium">{t.reference}</span>
                            </td>
                            <td>
                              <span className={`badge ${t.type === "hospital" ? "bg-primary" : "bg-success"} rounded`}>
                                {t.type === "hospital" ? "Consultation" : "Pharmacy"}
                              </span>
                            </td>
                            <td>{t.source}</td>
                            <td>{t.patientName || "—"}</td>
                            <td className="text-nowrap">{formatDate(t.date)}</td>
                            <td>{t.paymentMethod || "Cash"}</td>
                            <td className="text-end fw-semibold text-success">
                              +{formatCurrency(t.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                  <p className="mb-0 text-muted fs-13">
                    Total: <strong>{data.total}</strong> · Page {data.page} of {data.totalPages || 1}
                  </p>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      disabled={data.page <= 1}
                      onClick={() => setFilter("page", String(data.page - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setFilter("page", String(data.page + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyTransactionsPage;
