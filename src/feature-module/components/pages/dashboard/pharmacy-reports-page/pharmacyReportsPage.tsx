import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchReports,
  type ReportsSummaryResponse,
  type ReportsFilters,
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

const PharmacyReportsPage = () => {
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = (searchParams.get("period") as DashboardPeriod) || "last30days";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ReportsFilters = { period };
      const res = await fetchReports(filters);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load pharmacy reports");
    } finally {
      setLoading(false);
    }
  }, [period]);

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
            <h4 className="fw-bold mb-0">Pharmacy Reports</h4>
            <p className="text-muted mb-0 fs-13">
              Sales & dispense summary for your pharmacy
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
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
            <Link to={all_routes.pharmacyTransactions} className="btn btn-primary btn-sm">
              <i className="ti ti-list me-1" /> Transactions
            </Link>
            <Link to={all_routes.pharmacyInventoryReport} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-package me-1" /> Inventory report
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
          <>
            {/* Pharmacy-first: sales & revenue */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card shadow-sm border border-success border-opacity-25 h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0 rounded-circle bg-success bg-opacity-10 p-3 me-3">
                      <i className="ti ti-pill text-success fs-4" />
                    </div>
                    <div>
                      <p className="text-muted mb-1 fs-13">Pharmacy Sales</p>
                      <h4 className="fw-bold text-success mb-0">{formatCurrency(data.revenue.pharmacyRevenue)}</h4>
                      <span className="small text-muted">Dispensed medicines (period)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm border h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0 rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                      <i className="ti ti-currency-rupee text-primary fs-4" />
                    </div>
                    <div>
                      <p className="text-muted mb-1 fs-13">Total Revenue (Branch)</p>
                      <h4 className="fw-bold mb-0">{formatCurrency(data.revenue.total)}</h4>
                      <span className="small text-muted">Hospital + Pharmacy</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm border h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0 rounded-circle bg-info bg-opacity-10 p-3 me-3">
                      <i className="ti ti-building-hospital text-info fs-4" />
                    </div>
                    <div>
                      <p className="text-muted mb-1 fs-13">Consultation Revenue</p>
                      <h4 className="fw-bold text-info mb-0">{formatCurrency(data.revenue.hospitalRevenue)}</h4>
                      <span className="small text-muted">Appointment fees (same branch)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment stats (compact) - branch context */}
            <div className="row g-3 mb-4">
              <div className="col-12">
                <h6 className="text-muted mb-2">Branch appointment summary (same period)</h6>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body py-3">
                    <p className="text-muted mb-0 fs-13">All Appointments</p>
                    <h5 className="fw-bold mb-0">{data.appointmentStatistics.all}</h5>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body py-3">
                    <p className="text-muted mb-0 fs-13">Completed</p>
                    <h5 className="fw-bold text-success mb-0">{data.appointmentStatistics.completed}</h5>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body py-3">
                    <p className="text-muted mb-0 fs-13">Cancelled</p>
                    <h5 className="fw-bold text-danger mb-0">{data.appointmentStatistics.cancelled}</h5>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body py-3">
                    <p className="text-muted mb-0 fs-13">Scheduled</p>
                    <h5 className="fw-bold text-info mb-0">{data.appointmentStatistics.scheduled}</h5>
                  </div>
                </div>
              </div>
            </div>

            {data.topDepartments.length > 0 && (
              <div className="card shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">Top departments by revenue (branch)</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover border mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Department</th>
                          <th className="text-center">Appointments</th>
                          <th className="text-end">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topDepartments.map((d, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{d.name}</td>
                            <td className="text-center">{d.count}</td>
                            <td className="text-end fw-semibold">{formatCurrency(d.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyReportsPage;
