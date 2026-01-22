import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Datatable from "../../../../../core/common/dataTable";
import { useState, useEffect, useCallback, useMemo } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { DatePicker, Select } from "antd";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchPrescriptions,
  deletePrescription,
  type Prescription,
} from "../../../../../api/prescriptions";
import { fetchDoctors } from "../../../../../api/doctors";
import dayjs from "dayjs";

const DoctorsPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  
  // Filter states
  const [searchText, setSearchText] = useState<string>("");
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("Recent");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Find doctor by user email to get doctor name
  useEffect(() => {
    const findDoctor = async () => {
      if (!user?.email) return;
      
      try {
        const doctors = await fetchDoctors();
        const doctorsList = Array.isArray(doctors) ? doctors : doctors.data || [];
        const doctor = doctorsList.find(
          (d: any) => (d.Email || d.email || "").toLowerCase() === user.email.toLowerCase()
        );
        if (doctor) {
          setDoctorName(doctor.Name_Designation || doctor.Name || "");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to find doctor:", err);
      }
    };
    
    findDoctor();
  }, [user]);

  // Load prescriptions
  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = sortBy === "Recent" ? "-createdAt" : sortBy === "Oldest" ? "createdAt" : "-createdAt";
      
      // Fetch prescriptions from database
      const response = await fetchPrescriptions({
        page: 1,
        limit: 1000, // Get more data for client-side filtering
        sort: sortParam,
        search: searchText || undefined,
        doctor: doctorName || undefined,
        status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
        date: selectedDate ? selectedDate.format("YYYY-MM-DD") : undefined,
      });
      
      // Apply client-side filtering for multiple selections
      let filteredData = response.data || [];
      
      if (selectedStatuses.length > 1) {
        filteredData = filteredData.filter((p) => selectedStatuses.includes(p.Status || ""));
      }
      
      if (selectedDoctors.length > 0) {
        filteredData = filteredData.filter((p) => 
          selectedDoctors.some((doc) => (p.Doctor || "").includes(doc))
        );
      }
      
      // Apply date filter if selected
      if (selectedDate) {
        const filterDate = selectedDate.format("YYYY-MM-DD");
        filteredData = filteredData.filter((p) => {
          try {
            const prescDate = dayjs(p.Date || p.Prescribed_On).format("YYYY-MM-DD");
            return prescDate === filterDate;
          } catch {
            return false;
          }
        });
      }
      
      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setPrescriptions(paginatedData);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load prescriptions");
      // eslint-disable-next-line no-console
      console.error("Failed to load prescriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorName, page, pageSize, searchText, selectedStatuses, selectedDoctors, selectedDate, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPrescriptions();
    }, searchText ? 500 : 0);

    return () => clearTimeout(timer);
  }, [loadPrescriptions]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleDelete = async (prescription: Prescription) => {
    if (!window.confirm(`Are you sure you want to delete prescription ${prescription.Prescription_ID || prescription.id}?`)) {
      return;
    }

    try {
      const prescriptionId = prescription._id || prescription.id;
      if (!prescriptionId) {
        alert("Invalid prescription ID");
        return;
      }
      
      await deletePrescription(prescriptionId);
      alert("Prescription deleted successfully");
      loadPrescriptions();
    } catch (err: any) {
      alert(`Failed to delete prescription: ${err?.response?.data?.message || err?.message || "Unknown error"}`);
      // eslint-disable-next-line no-console
      console.error("Failed to delete prescription:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return dayjs(dateStr).format("DD MMM YYYY");
    } catch {
      return dateStr;
    }
  };

  const handleClearFilters = () => {
    setSelectedDoctors([]);
    setSelectedDesignations([]);
    setSelectedDepartments([]);
    setSelectedDate(null);
    setSelectedAmounts([]);
    setSelectedStatuses([]);
    setSearchText("");
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1);
  };

  // Transform prescriptions for table
  const tableData = useMemo(() => {
    return prescriptions.map((presc) => ({
      ...presc,
      key: presc._id || presc.id,
      img: presc.Patient_Image || presc.img || "user-01.jpg",
      phone_number: presc.phone_number || "",
    }));
  }, [prescriptions]);

  const columns = [
    {
      title: "Prescription ID",
      dataIndex: "Prescription_ID",
      render: (text: string, record: Prescription) => (
        <Link 
          to={`${all_routes.doctorsprescriptiondetails}?id=${record._id || record.id}`}
          className="fw-semibold"
        >
          {text || record.id || "N/A"}
        </Link>
      ),
      sorter: (a: any, b: any) => {
        const idA = (a.Prescription_ID || a.id || "").toString();
        const idB = (b.Prescription_ID || b.id || "").toString();
        return idA.localeCompare(idB);
      },
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={all_routes.doctorspatientdetails}
            className="avatar avatar-md me-2"
          >
            <ImageWithBasePath
              src={record.Patient_Image || `assets/img/users/${record.img || "user-01.jpg"}`}
              alt={text || "Patient"}
              className="rounded-circle"
            />
          </Link>
          <Link to={all_routes.doctorspatientdetails} className="fw-semibold">
            {text || "N/A"}
            {record.phone_number && (
              <span className="text-body fs-13 fw-normal d-block">
                {record.phone_number}
              </span>
            )}
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => (a.Patient || "").localeCompare(b.Patient || ""),
    },
    {
      title: "Prescribed On",
      dataIndex: "Prescribed_On",
      render: (text: string, record: any) => {
        const dateStr = text || record.Date || "";
        return dateStr ? formatDate(dateStr) : "N/A";
      },
      sorter: (a: any, b: any) => {
        const dateA = new Date(a.Prescribed_On || a.Date || 0).getTime();
        const dateB = new Date(b.Prescribed_On || b.Date || 0).getTime();
        return dateA - dateB;
      },
    },
    {
      title: "",
      render: (_: any, record: Prescription) => (
        <div className="action-item">
          <>
            <Link to="#" data-bs-toggle="dropdown">
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link
                  to={`${all_routes.doctorsprescriptiondetails}?id=${record._id || record.id}`}
                  className="dropdown-item d-flex align-items-center"
                >
                  View
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center text-danger"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(record);
                  }}
                >
                  Delete
                </Link>
              </li>
            </ul>
          </>
        </div>
      ),
    },
  ];

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
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
              <h4 className="fw-bold mb-0">Prescriptions</h4>
            </div>
            <div className="text-end d-flex">
              {/* dropdown*/}
              <div className="dropdown me-1">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center fw-regular"
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
            </div>
          </div>
          {/* End Page Header */}
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
                  <form action="#">
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label mb-1">Doctor</label>
                          {selectedDoctors.length > 0 && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedDoctors([]);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedDoctors}
                          onChange={setSelectedDoctors}
                          options={Doctor}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Designation</label>
                          {selectedDesignations.length > 0 && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedDesignations([]);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedDesignations}
                          onChange={setSelectedDesignations}
                          options={Designation}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Department</label>
                          {selectedDepartments.length > 0 && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedDepartments([]);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedDepartments}
                          onChange={setSelectedDepartments}
                          options={Department}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label mb-1 text-dark fs-14 fw-medium">
                            Date
                          </label>
                          {selectedDate && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedDate(null);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
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
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Amount</label>
                          {selectedAmounts.length > 0 && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAmounts([]);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedAmounts}
                          onChange={setSelectedAmounts}
                          options={Amount}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Status</label>
                          {selectedStatuses.length > 0 && (
                            <Link 
                              to="#" 
                              className="link-primary mb-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedStatuses([]);
                              }}
                            >
                              Reset
                            </Link>
                          )}
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedStatuses}
                          onChange={setSelectedStatuses}
                          options={Status}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <Link
                        to="#"
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
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary btn-md fw-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(1);
                          loadPrescriptions();
                          const filterDropdown = document.getElementById("filter-dropdown");
                          if (filterDropdown) {
                            const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(
                              document.querySelector('[data-bs-toggle="dropdown"]')
                            );
                            if (bsDropdown) bsDropdown.hide();
                          }
                        }}
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
                        handleSortChange("Recent");
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
                        handleSortChange("Oldest");
                      }}
                    >
                      Oldest
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              <button
                type="button"
                className="btn btn-sm btn-link"
                onClick={() => loadPrescriptions()}
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-file-off fs-48 text-muted mb-3 d-block" />
              <p className="text-muted mb-0">No prescriptions found</p>
              {doctorName && (
                <p className="text-muted fs-14 mt-2">
                  Prescriptions will appear here after completing consultations with medications.
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={false}
                searchText={searchText}
              />
            </div>
          )}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
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
    </>
  );
};

export default DoctorsPrescriptions;
