import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { all_routes } from "../../../../routes/all_routes";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchSuperAdminDashboard,
  type SuperAdminDashboardResponse,
  type SuperAdminBranchRow,
} from "../../../../../api/dashboard";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "super_admin") {
      window.location.href = all_routes.dashboard;
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetchSuperAdminDashboard();
        setData(resp);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load Super Admin dashboard");
        // eslint-disable-next-line no-console
        console.error("Failed to load super admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);

  const cards = useMemo(() => {
    const t = data?.totals;
    return [
      { label: "Total Branches", value: t?.branches ?? 0, icon: "ti ti-building-hospital" },
      { label: "Hospital Admins", value: t?.hospitalAdmins ?? 0, icon: "ti ti-user-cog" },
      { label: "Total Doctors", value: t?.doctors ?? 0, icon: "ti ti-stethoscope" },
      { label: "Total Patients", value: t?.patients ?? 0, icon: "ti ti-users" },
      { label: "Appointments", value: t?.appointments ?? 0, icon: "ti ti-calendar-event" },
      { label: "Revenue", value: formatCurrency(t?.revenue ?? 0), icon: "ti ti-currency-dollar" },
    ];
  }, [data]);

  const statusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    const isActive = s === "active";
    return (
      <span className={`badge rounded fs-13 fw-medium ${isActive ? "badge-soft-success text-success border-success border" : "badge-soft-danger text-danger border-danger border"}`}>
        {status || "Unknown"}
      </span>
    );
  };

  const columns: ColumnsType<SuperAdminBranchRow> = useMemo(
    () => [
      {
        title: "Branch",
        key: "branch",
        render: (_: any, record) => (
          <div>
            <div className="fw-semibold text-dark">{record.name}</div>
            <div className="text-muted fs-13">
              {(record.city || "-")}, {(record.state || "-")}
            </div>
          </div>
        ),
      },
      {
        title: "Admin",
        key: "admin",
        render: (_: any, record) =>
          record.admin ? (
            <div>
              <div className="fw-semibold">{record.admin.name}</div>
              <div className="text-muted fs-13">{record.admin.email}</div>
            </div>
          ) : (
            <span className="text-muted">Not assigned</span>
          ),
      },
      {
        title: "Doctors",
        dataIndex: ["counts", "doctors"],
        key: "doctors",
        sorter: (a, b) => (a.counts?.doctors || 0) - (b.counts?.doctors || 0),
      },
      {
        title: "Patients",
        dataIndex: ["counts", "patients"],
        key: "patients",
        sorter: (a, b) => (a.counts?.patients || 0) - (b.counts?.patients || 0),
      },
      {
        title: "Appointments",
        dataIndex: ["counts", "appointments"],
        key: "appointments",
        sorter: (a, b) => (a.counts?.appointments || 0) - (b.counts?.appointments || 0),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (v: string) => statusBadge(v),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record) => (
          <div className="d-flex align-items-center gap-1">
            <Link
              to={`${all_routes.editHospital}?id=${record.hospitalId}`}
              className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
              title="Edit Branch / Assign Admin"
            >
              <i className="ti ti-pencil" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading Super Admin dashboard...</p>
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
            {error || "Failed to load dashboard"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-semibold mb-0">Super Admin Dashboard</h4>
            <p className="text-muted mb-0">All-branches overview & reporting</p>
          </div>
          <div className="text-end d-flex gap-2">
            <Link to={all_routes.hospitals} className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center">
              <i className="ti ti-list me-2" />
              Manage Branches
            </Link>
            <Link to={all_routes.addHospital} className="btn btn-primary fs-13 btn-md">
              <i className="ti ti-plus me-1" /> Add Branch
            </Link>
          </div>
        </div>

        <div className="row g-3 mb-3">
          {cards.map((c) => (
            <div className="col-xl-2 col-lg-4 col-md-6" key={c.label}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">{c.label}</p>
                      <h5 className="mb-0 fw-bold">{c.value as any}</h5>
                    </div>
                    <span className="avatar avatar-sm bg-light rounded">
                      <i className={`${c.icon} text-dark`} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card shadow-sm">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Branches Report</h5>
            <small className="text-muted">Generated at: {new Date(data.generatedAt).toLocaleString()}</small>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <Table
                columns={columns}
                dataSource={data.branches}
                rowKey={(r) => r.hospitalId}
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

