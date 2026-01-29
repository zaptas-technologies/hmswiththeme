import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { List, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { all_routes } from "../../../../routes/all_routes";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchSuperAdminDashboard,
  type SuperAdminDashboardResponse,
  type SuperAdminBranchRow,
} from "../../../../../api/dashboard";

type ListModalType = "branches" | "admins" | "doctors" | "patients" | "appointments" | "revenue";
type ModalType = ListModalType | "branch-detail";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalPayload, setModalPayload] = useState<SuperAdminBranchRow | null>(null);

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
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const openModal = useCallback((type: ModalType, payload?: SuperAdminBranchRow | null) => {
    setModalType(type);
    setModalPayload(payload ?? null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setModalPayload(null);
  }, []);

  const cards = useMemo(() => {
    const t = data?.totals;
    return [
      { label: "Total Branches", value: t?.branches ?? 0, icon: "ti ti-building-hospital", modalType: "branches" as const },
      { label: "Hospital Admins", value: t?.hospitalAdmins ?? 0, icon: "ti ti-user-cog", modalType: "admins" as const },
      { label: "Total Doctors", value: t?.doctors ?? 0, icon: "ti ti-stethoscope", modalType: "doctors" as const },
      { label: "Total Patients", value: t?.patients ?? 0, icon: "ti ti-users", modalType: "patients" as const },
      { label: "Appointments", value: t?.appointments ?? 0, icon: "ti ti-calendar-event", modalType: "appointments" as const },
      { label: "Revenue", value: formatCurrency(t?.revenue ?? 0), icon: "ti ti-currency-dollar", modalType: "revenue" as const },
    ];
  }, [data]);

  const listModalData = useMemo(() => {
    if (!data?.branches) return { admins: [], doctors: [], patients: [], appointments: [] };
    const admins = data.branches
      .filter((b) => b.admin)
      .map((b) => ({ ...b.admin!, branchName: b.name }));
    const doctors = data.branches.map((b) => ({ branchName: b.name, count: b.counts?.doctors ?? 0 }));
    const patients = data.branches.map((b) => ({ branchName: b.name, count: b.counts?.patients ?? 0 }));
    const appointments = data.branches.map((b) => ({ branchName: b.name, count: b.counts?.appointments ?? 0 }));
    return { admins, doctors, patients, appointments };
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
          <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
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

  const modalTitle = useMemo(() => {
    if (modalType === "branch-detail") return "Branch details";
    const titles: Record<ListModalType, string> = {
      branches: "All branches",
      admins: "Hospital admins",
      doctors: "Doctors by branch",
      patients: "Patients by branch",
      appointments: "Appointments by branch",
      revenue: "Revenue summary",
    };
    return titles[modalType as ListModalType] ?? "Details";
  }, [modalType]);

  const renderModalContent = () => {
    if (!data) return null;
    if (modalType === "branch-detail" && modalPayload) {
      const r = modalPayload;
      return (
        <div className="small">
          <dl className="row mb-0">
            <dt className="col-sm-4 text-muted">Branch</dt>
            <dd className="col-sm-8 fw-semibold">{r.name}</dd>
            <dt className="col-sm-4 text-muted">Location</dt>
            <dd className="col-sm-8">{(r.city || "-")}, {(r.state || "-")}</dd>
            <dt className="col-sm-4 text-muted">Status</dt>
            <dd className="col-sm-8">{statusBadge(r.status)}</dd>
            <dt className="col-sm-4 text-muted">Admin</dt>
            <dd className="col-sm-8">
              {r.admin ? (
                <>
                  <div>{r.admin.name}</div>
                  <div className="text-muted">{r.admin.email}</div>
                  {r.admin.phone && <div className="text-muted">{r.admin.phone}</div>}
                </>
              ) : (
                <span className="text-muted">Not assigned</span>
              )}
            </dd>
            <dt className="col-sm-4 text-muted">Doctors</dt>
            <dd className="col-sm-8">{r.counts?.doctors ?? 0}</dd>
            <dt className="col-sm-4 text-muted">Patients</dt>
            <dd className="col-sm-8">{r.counts?.patients ?? 0}</dd>
            <dt className="col-sm-4 text-muted">Appointments</dt>
            <dd className="col-sm-8">{r.counts?.appointments ?? 0}</dd>
          </dl>
          <div className="d-flex gap-2 mt-3 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                closeModal();
                navigate(`${all_routes.editHospital}?id=${r.hospitalId}`);
              }}
            >
              <i className="ti ti-pencil me-1" /> Edit branch
            </button>
          </div>
        </div>
      );
    }
    if (modalType === "branches") {
      return (
        <List
          size="small"
          dataSource={data.branches}
          renderItem={(item) => (
            <List.Item className="border-0 border-bottom py-2">
              <div className="d-flex justify-content-between align-items-center w-100">
                <div>
                  <div className="fw-semibold">{item.name}</div>
                  <div className="text-muted fs-13">{(item.city || "-")}, {(item.state || "-")}</div>
                </div>
                {statusBadge(item.status)}
              </div>
            </List.Item>
          )}
          style={{ maxHeight: 360, overflow: "auto" }}
        />
      );
    }
    if (modalType === "admins") {
      return (
        <List
          size="small"
          dataSource={listModalData.admins}
          renderItem={(item: { name: string; email: string; branchName: string }) => (
            <List.Item className="border-0 border-bottom py-2">
              <div>
                <div className="fw-semibold">{item.name}</div>
                <div className="text-muted fs-13">{item.email}</div>
                <div className="text-muted fs-12">{item.branchName}</div>
              </div>
            </List.Item>
          )}
          style={{ maxHeight: 360, overflow: "auto" }}
        />
      );
    }
    if (modalType === "doctors" || modalType === "patients" || modalType === "appointments") {
      const list = listModalData[modalType];
      return (
        <List
          size="small"
          dataSource={list}
          renderItem={(item: { branchName: string; count: number }) => (
            <List.Item className="border-0 border-bottom py-2">
              <div className="d-flex justify-content-between align-items-center w-100">
                <span className="fw-medium">{item.branchName}</span>
                <span className="badge bg-primary rounded-pill">{item.count}</span>
              </div>
            </List.Item>
          )}
          style={{ maxHeight: 360, overflow: "auto" }}
        />
      );
    }
    if (modalType === "revenue") {
      const rev = data.totals?.revenue ?? 0;
      return (
        <div className="py-2">
          <p className="text-muted mb-2">Aggregated revenue across all branches.</p>
          <p className="fs-4 fw-bold text-primary mb-0">{formatCurrency(rev)}</p>
        </div>
      );
    }
    return null;
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
              <div
                role="button"
                tabIndex={0}
                className="card shadow-sm h-100 super-admin-dashboard-card"
                onClick={() => openModal(c.modalType)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openModal(c.modalType);
                  }
                }}
                style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">{c.label}</p>
                      <h5 className="mb-0 fw-bold">{c.value as React.ReactNode}</h5>
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
                onRow={(record) => ({
                  role: "button",
                  tabIndex: 0,
                  onClick: () => openModal("branch-detail", record),
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openModal("branch-detail", record);
                    }
                  },
                  style: { cursor: "pointer" },
                })}
              />
            </div>
          </div>
        </div>

        <Modal
          title={modalTitle}
          open={modalOpen}
          onCancel={closeModal}
          footer={null}
          width={modalType === "branch-detail" ? 480 : 520}
          destroyOnClose
          centered
          styles={{ body: { maxHeight: 420, overflow: "auto" } }}
        >
          {renderModalContent()}
        </Modal>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

