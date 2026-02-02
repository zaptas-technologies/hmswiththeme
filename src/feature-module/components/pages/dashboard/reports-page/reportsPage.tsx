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

const ReportsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hospitalIdParam = searchParams.get("hospitalId") || undefined;
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = (searchParams.get("period") as DashboardPeriod) || "last30days";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ReportsFilters = { period };
      if (user?.role === "super_admin" && hospitalIdParam) filters.hospitalId = hospitalIdParam;
      const res = await fetchReports(filters);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [period, hospitalIdParam, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Reports</h4>
            <p className="text-muted mb-0 fs-13">
              {isSuperAdmin && hospitalIdParam
                ? "Branch report (filtered by branch)"
                : "Appointment & revenue summary"}
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
            {isSuperAdmin && (
              <Link to={all_routes.superAdminDashboard} className="btn btn-outline-secondary btn-sm">
                <i className="ti ti-arrow-left me-1" /> Back to branches
              </Link>
            )}
            <Link
              to={`${all_routes.clinicTransactions}${hospitalIdParam ? `?hospitalId=${hospitalIdParam}` : ""}`}
              className="btn btn-primary btn-sm"
            >
              <i className="ti ti-list me-1" /> Transactions
            </Link>
            <Link
              to={`${all_routes.clinicInventoryReport}${hospitalIdParam ? `?hospitalId=${hospitalIdParam}` : ""}`}
              className="btn btn-outline-primary btn-sm"
            >
              <i className="ti ti-package me-1" /> Inventory report
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
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body">
                    <p className="text-muted mb-1 fs-13">All Appointments</p>
                    <h4 className="fw-bold mb-0">{data.appointmentStatistics.all}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body">
                    <p className="text-muted mb-1 fs-13">Completed</p>
                    <h4 className="fw-bold mb-0 text-success">{data.appointmentStatistics.completed}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body">
                    <p className="text-muted mb-1 fs-13">Cancelled</p>
                    <h4 className="fw-bold mb-0 text-danger">{data.appointmentStatistics.cancelled}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-body">
                    <p className="text-muted mb-1 fs-13">Scheduled</p>
                    <h4 className="fw-bold mb-0 text-info">{data.appointmentStatistics.scheduled}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card shadow-sm border">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Hospital Revenue</h6>
                    <h4 className="fw-bold text-primary mb-0">{formatCurrency(data.revenue.hospitalRevenue)}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm border">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Pharmacy Revenue</h6>
                    <h4 className="fw-bold text-success mb-0">{formatCurrency(data.revenue.pharmacyRevenue)}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm border">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Total Revenue</h6>
                    <h4 className="fw-bold mb-0">{formatCurrency(data.revenue.total)}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">Top departments (by revenue)</h5>
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
                      {data.topDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-3">No data</td>
                        </tr>
                      ) : (
                        data.topDepartments.map((d, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{d.name}</td>
                            <td className="text-center">{d.count}</td>
                            <td className="text-end fw-semibold">{formatCurrency(d.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
