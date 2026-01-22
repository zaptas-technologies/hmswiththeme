import { DatePicker, Select } from "antd";
import { Link } from "react-router";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import { useState, useEffect, useMemo, useCallback } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import Modals from "./modals/modals";
import {
  fetchDoctorLeaves,
  deleteDoctorLeave,
  type DoctorLeave,
} from "../../../../../api/doctorLeaves";

const DoctorsLeaves = () => {
  const [rows, setRows] = useState<DoctorLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedLeave, setSelectedLeave] = useState<DoctorLeave | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [filterDoctors, setFilterDoctors] = useState<string[]>([]);
  const [filterDesignations, setFilterDesignations] = useState<string[]>([]);
  const [filterDepartments, setFilterDepartments] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [sortBy, setSortBy] = useState<string>("Recent");

  const columns = useMemo(
    () => [
    {
      title: "Date",
      dataIndex: "Date",
      sorter: (a: any, b: any) => a.Date.length - b.Date.length,
    },
    {
      title: "Leave Type",
      dataIndex: "Leave_Type",
      sorter: (a: any, b: any) => a.Leave_Type.length - b.Leave_Type.length,
    },
    {
      title: "Day",
      dataIndex: "Day",
      sorter: (a: any, b: any) => a.Day.length - b.Day.length,
    },
    {
      title: "Applied On",
      dataIndex: "Applied_On",
      sorter: (a: any, b: any) => a.Applied_On.length - b.Applied_On.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any) => (
        <span
          className={`badge badge-sm border rounded
    ${
      text === "Applied"
        ? "badge-info text-info border-info"
        : text === "Approved"
        ? "badge-success text-success border-success"
        : "badge-danger text-danger border-danger"
    }`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: (_: any, record: DoctorLeave) => (
        <div className="action-item">
          <>
            <Link to="#" data-bs-toggle="dropdown">
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#edit-leave"
                  onClick={() => setSelectedLeave(record)}
                >
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#delete_modal"
                  onClick={() => setSelectedLeave(record)}
                >
                  Delete
                </Link>
              </li>
            </ul>
          </>
        </div>
      ),
    },
  ],
  []
);

  const loadDoctorLeaves = useCallback(
    async (opts?: {
      page?: number;
      pageSize?: number;
      search?: string;
      filters?: {
        doctors?: string[];
        designations?: string[];
        departments?: string[];
        status?: string[];
        date?: Dayjs | null;
      };
    }) => {
      const nextPage = opts?.page ?? page;
      const nextLimit = opts?.pageSize ?? pageSize;
      const nextSearch = opts?.search ?? searchText;
      const filters = opts?.filters ?? {
        doctors: filterDoctors,
        designations: filterDesignations,
        departments: filterDepartments,
        status: filterStatus,
        date: filterDate,
      };

      setLoading(true);
      try {
        const sortParam = sortBy === "Recent" ? "-createdAt" : "createdAt";
        const params: any = {
          page: nextPage,
          limit: nextLimit,
          sort: sortParam,
          search: nextSearch || undefined,
        };

        if (filters.doctors && filters.doctors.length > 0) {
          params.doctor = filters.doctors.join(",");
        }
        if (filters.designations && filters.designations.length > 0) {
          params.designation = filters.designations.join(",");
        }
        if (filters.departments && filters.departments.length > 0) {
          params.department = filters.departments.join(",");
        }
        if (filters.status && filters.status.length > 0) {
          params.status = filters.status.join(",");
        }
        if (filters.date) {
          params.dateFrom = filters.date.format("YYYY-MM-DD");
          params.dateTo = filters.date.format("YYYY-MM-DD");
        }

        const resp = await fetchDoctorLeaves(params);
        setRows(resp.data || []);
        setTotal(resp.pagination?.total ?? resp.data?.length ?? 0);
        setPage(resp.pagination?.page ?? nextPage);
        setPageSize(resp.pagination?.limit ?? nextLimit);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error("Failed to load doctor leaves", e);
        alert(
          `Failed to load doctor leaves: ${
            e?.response?.data?.message || e?.message || "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, searchText, filterDoctors, filterDesignations, filterDepartments, filterStatus, filterDate, sortBy]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadDoctorLeaves({ page: 1, search: searchText });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, pageSize, sortBy]);

  useEffect(() => {
    loadDoctorLeaves({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async () => {
    if (!selectedLeave) return;
    const id = selectedLeave._id || selectedLeave.id;
    if (!id) return;
    try {
      await deleteDoctorLeave(id);
      setSelectedLeave(null);
      await loadDoctorLeaves({ page });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete doctor leave", e);
      alert(
        `Failed to delete doctor leave: ${
          e?.response?.data?.message || e?.message || "Unknown error"
        }`
      );
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctorLeaves({
      page: 1,
      filters: {
        doctors: filterDoctors,
        designations: filterDesignations,
        departments: filterDepartments,
        status: filterStatus,
        date: filterDate,
      },
    });
  };

  const handleClearFilters = () => {
    setFilterDoctors([]);
    setFilterDesignations([]);
    setFilterDepartments([]);
    setFilterStatus([]);
    setFilterDate(null);
    loadDoctorLeaves({ page: 1 });
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0"> Leaves </h4>
            </div>
            <div className="text-end d-flex">
              {/* dropdown*/}
              <div className="dropdown me-1">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
              <Link
                to="#"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add-leave"
                onClick={() => setSelectedLeave(null)}
              >
                <i className="ti ti-plus me-1" />
                Add New Leave
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/* Start Filter */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="table-search d-flex align-items-center mb-0">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter text-gray-5 me-1" />
                  Filters
                </Link>
                <div
                  className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0"
                  id="filter-dropdown"
                >
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                    <h4 className="mb-0 fw-bold">Filter</h4>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="link-danger text-decoration-underline"
                        onClick={(e) => {
                          e.preventDefault();
                          handleClearFilters();
                        }}
                      >
                        Clear All
                      </Link>
                    </div>
                  </div>
                  <form onSubmit={handleFilterSubmit}>
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label mb-1">Doctor</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={filterDoctors}
                          onChange={setFilterDoctors}
                          options={Doctor}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Designation</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={filterDesignations}
                          onChange={setFilterDesignations}
                          options={Designation}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Department</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={filterDepartments}
                          onChange={setFilterDepartments}
                          options={Department}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Date<span className="text-danger">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker"
                            format={{
                              format: "DD-MM-YYYY",
                              type: "mask",
                            }}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            suffixIcon={null}
                            value={filterDate}
                            onChange={setFilterDate}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Amount</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          defaultValue={[]}
                          options={Amount}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Status</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={filterStatus}
                          onChange={setFilterStatus}
                          options={Status}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <button
                        type="button"
                        className="btn btn-light btn-md me-2 fw-medium"
                        id="close-filter"
                        onClick={(e) => {
                          e.preventDefault();
                          const filterDropdown = document.getElementById("filter-dropdown");
                          if (filterDropdown) {
                            const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(
                              document.querySelector('[data-bs-toggle="dropdown"]')
                            );
                            if (bsDropdown) bsDropdown.hide();
                          }
                        }}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-md fw-medium"
                      >
                        Filter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Sort By : </span> {sortBy}
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSortBy("Recent");
                      }}
                    >
                      Recent
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSortBy("Oldest");
                      }}
                    >
                      Oldest
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* End Filter */}
          {/* Start Table */}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={rows}
                Selection={false}
                searchText={searchText}
              />
            )}
          </div>
          {/* End Table */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2026©
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals
        selectedLeave={selectedLeave}
        onSuccess={() => {
          setSelectedLeave(null);
          loadDoctorLeaves({ page });
        }}
        onDelete={handleDelete}
      />
    </>
  );
};

export default DoctorsLeaves;
