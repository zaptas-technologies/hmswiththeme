import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect, useMemo } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  deleteGRN,
  fetchGRN,
  type GRN,
} from "../../../../../api/grn";

const GRNList = () => {
  const [rows, setRows] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadGRN = async (opts?: { page?: number; pageSize?: number; search?: string; status?: string }) => {
    const nextPage = opts?.page ?? page;
    const nextLimit = opts?.pageSize ?? pageSize;
    const nextSearch = opts?.search ?? searchText;
    const nextStatus = opts?.status ?? statusFilter;

    setLoading(true);
    try {
      const resp = await fetchGRN({
        page: nextPage,
        limit: nextLimit,
        sort: "-createdAt",
        search: nextSearch || undefined,
        status: nextStatus || undefined,
      });
      setRows(resp.data || []);
      setTotal(resp.pagination?.total ?? resp.data?.length ?? 0);
      setPage(resp.pagination?.page ?? nextPage);
      setPageSize(resp.pagination?.limit ?? nextLimit);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to load GRN", e);
      alert(`Failed to load GRN: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadGRN({ page: 1, search: searchText, status: statusFilter });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, pageSize]);

  useEffect(() => {
    loadGRN({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!selectedGRN) return;
    const id = selectedGRN._id || selectedGRN.id;
    if (!id) return;
    try {
      await deleteGRN(id);
      setSelectedGRN(null);
      await loadGRN({ page });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete GRN", e);
      alert(`Failed to delete GRN: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Draft: { className: "badge-soft-secondary text-secondary border-secondary border", label: "Draft" },
      Received: { className: "badge-soft-success text-success border-success border", label: "Received" },
      Cancelled: { className: "badge-soft-danger text-danger border-danger border", label: "Cancelled" },
    };
    const statusInfo = statusMap[status] || statusMap.Draft;
    return (
      <span className={`badge rounded fs-13 fw-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const columns: ColumnsType<GRN> = useMemo(
    () => [
      {
        title: "GRN Number",
        dataIndex: "GRN_Number",
        key: "GRN_Number",
        render: (text: string) => <div className="fw-semibold text-dark">{text}</div>,
        sorter: (a, b) => (a.GRN_Number || "").localeCompare(b.GRN_Number || ""),
      },
      {
        title: "GRN Date",
        dataIndex: "GRN_Date",
        key: "GRN_Date",
        render: (date: Date | string) => formatDate(date),
        sorter: (a, b) => {
          const dateA = a.GRN_Date ? new Date(a.GRN_Date).getTime() : 0;
          const dateB = b.GRN_Date ? new Date(b.GRN_Date).getTime() : 0;
          return dateA - dateB;
        },
      },
      {
        title: "Supplier",
        dataIndex: "Supplier",
        key: "Supplier",
        render: (text: string) => text || "-",
        sorter: (a, b) => (a.Supplier || "").localeCompare(b.Supplier || ""),
      },
      {
        title: "Items Count",
        key: "itemsCount",
        render: (_: any, record: GRN) => (
          <div>
            <span className="fw-semibold">{record.Items?.length || 0}</span>
            <span className="text-muted ms-1 fs-13">items</span>
          </div>
        ),
      },
      {
        title: "Total Amount",
        dataIndex: "Total_Amount",
        key: "Total_Amount",
        render: (amount: number) => amount ? `$${amount.toFixed(2)}` : "$0.00",
        sorter: (a, b) => (a.Total_Amount || 0) - (b.Total_Amount || 0),
      },
      {
        title: "Status",
        dataIndex: "Status",
        key: "Status",
        render: (status: string) => getStatusBadge(status),
        filters: [
          { text: "Draft", value: "Draft" },
          { text: "Received", value: "Received" },
          { text: "Cancelled", value: "Cancelled" },
        ],
        onFilter: (value, record) => record.Status === value,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: GRN) => (
          <div className="d-flex align-items-center gap-1">
            <Link
              to={`${all_routes.editGRN}?id=${record._id || record.id}`}
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
                  to={`${all_routes.editGRN}?id=${record._id || record.id}`}
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
                  onClick={() => setSelectedGRN(record)}
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

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      setPage(pagination.current);
    }
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize);
    }
    loadGRN({ page: pagination.current || page, pageSize: pagination.pageSize || pageSize });
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-semibold mb-0">GRN (Goods Receipt Note)</h4>
            </div>
            <div className="text-end d-flex gap-2">
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Filter
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "" ? "active" : ""}`}
                      onClick={() => setStatusFilter("")}
                    >
                      All Status
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Draft" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Draft")}
                    >
                      Draft
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Received" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Received")}
                    >
                      Received
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Cancelled" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Cancelled")}
                    >
                      Cancelled
                    </Link>
                  </li>
                </ul>
              </div>
              <Link
                to={all_routes.addGRN}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" /> Create New GRN
              </Link>
            </div>
          </div>

          <div className="mb-3">
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by GRN number, supplier..."
            />
          </div>

          <div className="table-responsive">
            <Table
              columns={columns}
              dataSource={rows}
              rowKey={(record) => record._id || record.id || ""}
              loading={loading}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} GRNs`,
              }}
              onChange={handleTableChange}
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
                Delete GRN
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete GRN{" "}
                <strong>{selectedGRN?.GRN_Number}</strong>? This action
                cannot be undone.
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
                data-bs-dismiss="modal"
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

export default GRNList;
