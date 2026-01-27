import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect, useMemo } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  deleteHospital,
  fetchHospitals,
  type Hospital,
} from "../../../../../api/hospitals";
import { useAuth } from "../../../../../core/context/AuthContext";

const HospitalsList = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Only super_admin can access this page
  useEffect(() => {
    if (user?.role !== "super_admin") {
      window.location.href = all_routes.dashboard;
    }
  }, [user]);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const hospitals = await fetchHospitals();
      setRows(hospitals);
    } catch (e: any) {
      console.error("Failed to load hospitals", e);
      alert(`Failed to load hospitals: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleDelete = async () => {
    if (!selectedHospital) return;
    const id = selectedHospital._id;
    if (!id) return;
    try {
      await deleteHospital(id);
      setSelectedHospital(null);
      await loadHospitals();
      // Close modal
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    } catch (e: any) {
      console.error("Failed to delete hospital", e);
      alert(`Failed to delete hospital: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Active: { className: "badge-soft-success text-success border-success border", label: "Active" },
      Inactive: { className: "badge-soft-danger text-danger border-danger border", label: "Inactive" },
    };
    const statusInfo = statusMap[status] || statusMap.Active;
    return (
      <span className={`badge rounded fs-13 fw-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const search = searchText.toLowerCase();
    return rows.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(search) ||
        hospital.city.toLowerCase().includes(search) ||
        hospital.state.toLowerCase().includes(search) ||
        hospital.email.toLowerCase().includes(search) ||
        hospital.phone.includes(search)
    );
  }, [rows, searchText]);

  const columns: ColumnsType<Hospital> = useMemo(
    () => [
      {
        title: "Hospital Name",
        dataIndex: "name",
        key: "name",
        render: (text: string, record: Hospital) => (
          <div>
            <div className="fw-semibold text-dark">{text}</div>
            <div className="text-muted fs-13">{record.city}, {record.state}</div>
          </div>
        ),
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      },
      {
        title: "Address",
        dataIndex: "address",
        key: "address",
        render: (text: string) => text || "-",
      },
      {
        title: "Contact",
        key: "contact",
        render: (_: any, record: Hospital) => (
          <div>
            <div className="fw-semibold">{record.phone}</div>
            <div className="text-muted fs-13">{record.email}</div>
          </div>
        ),
      },
      {
        title: "Hospital Admin",
        key: "hospitalAdmin",
        render: (_: any, record: Hospital) => {
          const admin = typeof record.hospitalAdmin === "object" ? record.hospitalAdmin : null;
          return admin ? (
            <div>
              <div className="fw-semibold">{admin.name}</div>
              <div className="text-muted fs-13">{admin.email}</div>
            </div>
          ) : (
            <span className="text-muted">Not assigned</span>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: string) => getStatusBadge(status),
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: Hospital) => (
          <div className="d-flex align-items-center gap-1">
            <Link
              to={`${all_routes.editHospital}?id=${record._id}`}
              className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
              title="Edit"
            >
              <i className="ti ti-pencil" />
            </Link>
            <Link
              to="#"
              className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
              data-bs-toggle="dropdown"
              title="More"
            >
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link
                  to={`${all_routes.editHospital}?id=${record._id}`}
                  className="dropdown-item d-flex align-items-center"
                >
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center text-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#delete_modal"
                  onClick={() => setSelectedHospital(record)}
                >
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-semibold mb-0">Hospitals</h4>
              <p className="text-muted mb-0">Manage hospital branches</p>
            </div>
            <div className="text-end d-flex">
              <Link
                to={all_routes.addHospital}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" /> Add New Hospital
              </Link>
            </div>
          </div>

          <div className="mb-3">
            <SearchInput
              value={searchText}
              onChange={(value) => setSearchText(value)}
            />
          </div>

          <div className="table-responsive">
            <Table
              columns={columns}
              dataSource={filteredRows}
              rowKey={(record) => record._id || ""}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} hospitals`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div
        className="modal fade"
        id="delete_modal"
        tabIndex={-1}
        aria-labelledby="delete_modalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="delete_modalLabel">
                Delete Hospital
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedHospital?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HospitalsList;
