import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect, useMemo } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  deleteInventory,
  fetchInventory,
  type Inventory,
} from "../../../../../api/inventory";

const InventoryList = () => {
  const [rows, setRows] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadInventory = async (opts?: { page?: number; pageSize?: number; search?: string; status?: string }) => {
    const nextPage = opts?.page ?? page;
    const nextLimit = opts?.pageSize ?? pageSize;
    const nextSearch = opts?.search ?? searchText;
    const nextStatus = opts?.status ?? statusFilter;

    setLoading(true);
    try {
      const resp = await fetchInventory({
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
      console.error("Failed to load inventory", e);
      alert(`Failed to load inventory: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadInventory({ page: 1, search: searchText, status: statusFilter });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, pageSize]);

  useEffect(() => {
    loadInventory({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!selectedInventory) return;
    const id = selectedInventory._id || selectedInventory.id;
    if (!id) return;
    try {
      await deleteInventory(id);
      setSelectedInventory(null);
      await loadInventory({ page });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete inventory", e);
      alert(`Failed to delete inventory: ${e?.response?.data?.message || e?.message || "Unknown error"}`);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Available: { className: "badge-soft-success text-success border-success border", label: "Available" },
      "Low Stock": { className: "badge-soft-warning text-warning border-warning border", label: "Low Stock" },
      "Out of Stock": { className: "badge-soft-danger text-danger border-danger border", label: "Out of Stock" },
      Expired: { className: "badge-soft-danger text-danger border-danger border", label: "Expired" },
    };
    const statusInfo = statusMap[status] || statusMap.Available;
    return (
      <span className={`badge rounded fs-13 fw-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const columns: ColumnsType<Inventory> = useMemo(
    () => [
      {
        title: "Item Name",
        dataIndex: "Item_Name",
        key: "Item_Name",
        render: (text: string, record: Inventory) => (
          <div>
            <div className="fw-semibold text-dark">{text}</div>
            {record.Item_Code && (
              <div className="text-muted fs-13">Code: {record.Item_Code}</div>
            )}
          </div>
        ),
        sorter: (a, b) => (a.Item_Name || "").localeCompare(b.Item_Name || ""),
      },
      {
        title: "Category",
        dataIndex: "Category",
        key: "Category",
        render: (text: string) => text || "-",
      },
      {
        title: "Batch Number",
        dataIndex: "Batch_Number",
        key: "Batch_Number",
        render: (text: string) => text || "-",
      },
      {
        title: "Expiry Date",
        dataIndex: "Expiry_Date",
        key: "Expiry_Date",
        render: (date: Date | string) => formatDate(date),
        sorter: (a, b) => {
          const dateA = a.Expiry_Date ? new Date(a.Expiry_Date).getTime() : 0;
          const dateB = b.Expiry_Date ? new Date(b.Expiry_Date).getTime() : 0;
          return dateA - dateB;
        },
      },
      {
        title: "Quantity",
        dataIndex: "Quantity",
        key: "Quantity",
        render: (qty: number, record: Inventory) => (
          <div>
            <span className="fw-semibold">{qty || 0}</span>
            {record.Unit && <span className="text-muted ms-1 fs-13">{record.Unit}</span>}
          </div>
        ),
        sorter: (a, b) => (a.Quantity || 0) - (b.Quantity || 0),
      },
      {
        title: "Unit Price",
        dataIndex: "Unit_Price",
        key: "Unit_Price",
        render: (price: number) => price ? `$${price.toFixed(2)}` : "-",
        sorter: (a, b) => (a.Unit_Price || 0) - (b.Unit_Price || 0),
      },
      {
        title: "Status",
        dataIndex: "Status",
        key: "Status",
        render: (status: string) => getStatusBadge(status),
        filters: [
          { text: "Available", value: "Available" },
          { text: "Low Stock", value: "Low Stock" },
          { text: "Out of Stock", value: "Out of Stock" },
          { text: "Expired", value: "Expired" },
        ],
        onFilter: (value, record) => record.Status === value,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: Inventory) => (
          <div className="d-flex align-items-center gap-1">
            <Link
              to={`${all_routes.editInventory}?id=${record._id || record.id}`}
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
                  to={`${all_routes.editInventory}?id=${record._id || record.id}`}
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
                  onClick={() => setSelectedInventory(record)}
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
    loadInventory({ page: pagination.current || page, pageSize: pagination.pageSize || pageSize });
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-semibold mb-0">Inventory</h4>
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
                      className={`dropdown-item ${statusFilter === "Available" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Available")}
                    >
                      Available
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Low Stock" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Low Stock")}
                    >
                      Low Stock
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Out of Stock" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Out of Stock")}
                    >
                      Out of Stock
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item ${statusFilter === "Expired" ? "active" : ""}`}
                      onClick={() => setStatusFilter("Expired")}
                    >
                      Expired
                    </Link>
                  </li>
                </ul>
              </div>
              <Link
                to={all_routes.addInventory}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" /> Add New Item
              </Link>
            </div>
          </div>

          <div className="mb-3">
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by item name, code, batch number..."
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
                showTotal: (total) => `Total ${total} items`,
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
                Delete Inventory Item
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
                Are you sure you want to delete{" "}
                <strong>{selectedInventory?.Item_Name}</strong>? This action
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

export default InventoryList;
