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
  const [total, setTotal] = useState(0);

  // Find doctor by user email/name to get doctor name
  useEffect(() => {
    const findDoctor = async () => {
      // If user is not a doctor, don't proceed
      if (!user || user.role !== "doctor") {
        setLoading(false);
        if (user && user.role !== "doctor") {
          setError("Access denied. Doctor role required.");
        }
        return;
      }
      
      try {
        const doctors = await fetchDoctors();
        const doctorsList = Array.isArray(doctors) ? doctors : doctors.data || [];
        
        // Try to find doctor by email first
        let doctor = doctorsList.find(
          (d: any) => (d.Email || d.email || "").toLowerCase() === (user.email || "").toLowerCase()
        );
        
        // If not found by email, try to find by name (for logged-in doctors)
        if (!doctor && user.name) {
          doctor = doctorsList.find(
            (d: any) => {
              const doctorName = (d.Name_Designation || d.name || "").toLowerCase().trim();
              const userName = user.name.toLowerCase().trim();
              // Check if names match (exact or partial)
              return doctorName === userName || doctorName.includes(userName) || userName.includes(doctorName);
            }
          );
        }
        
        // If still not found, use the user's name directly (for doctors logged in)
        if (!doctor) {
          // Use the logged-in doctor's name directly
          const doctorName = user.name || "";
          if (doctorName) {
            setDoctorName(doctorName);
            // eslint-disable-next-line no-console
            console.log("Using logged-in doctor name:", doctorName);
            return;
          }
        }
        
        if (doctor) {
          const name = doctor.Name_Designation || doctor.name || "";
          setDoctorName(name);
          // eslint-disable-next-line no-console
          console.log("Doctor found:", name);
        } else {
          // Last resort: use user's name if available
          if (user.name) {
            setDoctorName(user.name);
            // eslint-disable-next-line no-console
            console.log("Using user name as doctor name:", user.name);
          } else {
            setLoading(false);
            setError("Doctor profile not found. Please contact administrator.");
            // eslint-disable-next-line no-console
            console.warn("Doctor not found for email:", user.email, "and name:", user.name);
          }
        }
      } catch (err) {
        // If error occurs, try using user's name directly as fallback
        if (user.name && user.role === "doctor") {
          setDoctorName(user.name);
          // eslint-disable-next-line no-console
          console.log("Error fetching doctors, using user name as fallback:", user.name);
        } else {
          setLoading(false);
          setError("Failed to load doctor information");
          // eslint-disable-next-line no-console
          console.error("Failed to find doctor:", err);
        }
      }
    };
    
    findDoctor();
  }, [user]);

  // Load prescriptions with proper server-side pagination
  const loadPrescriptions = useCallback(async () => {
    // If user is not a doctor, don't proceed
    if (!user || user.role !== "doctor") {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = sortBy === "Recent" ? "-createdAt" : sortBy === "Oldest" ? "createdAt" : "-createdAt";
      
      // eslint-disable-next-line no-console
      console.log("[Prescriptions] Loading with params:", {
        doctorName,
        page,
        pageSize,
        searchText,
        selectedStatuses,
        selectedDoctors,
        selectedDate,
        sortBy,
      });
      
      // For multiple filters, we need to fetch all and filter client-side
      // For single filters or no filters, use server-side pagination
      const hasMultipleFilters = selectedStatuses.length > 1 || selectedDoctors.length > 1 || selectedDate !== null;
      
      // Try with doctor filter if available, otherwise fetch all
      let response = await fetchPrescriptions({
        page: hasMultipleFilters ? 1 : page,
        limit: hasMultipleFilters ? 1000 : pageSize,
        sort: sortParam,
        search: searchText || undefined,
        doctor: doctorName || undefined,
        status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
        date: selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : undefined,
      });
      
      // eslint-disable-next-line no-console
      console.log("[Prescriptions] Response with doctor filter:", {
        dataCount: response.data?.length || 0,
        total: response.pagination?.total || 0,
        doctorName: doctorName || "Not set",
        hasDoctorName: !!doctorName,
      });
      
      // If no results with doctor filter and we have a doctor name, try without doctor filter to debug
      if ((!response.data || response.data.length === 0) && doctorName) {
        // eslint-disable-next-line no-console
        console.log("[Prescriptions] No results with doctor filter, trying without filter to check if prescriptions exist...");
        const responseWithoutDoctor = await fetchPrescriptions({
          page: 1,
          limit: 10,
          sort: sortParam,
        });
        
        // eslint-disable-next-line no-console
        console.log("[Prescriptions] Response without doctor filter:", {
          dataCount: responseWithoutDoctor.data?.length || 0,
          total: responseWithoutDoctor.pagination?.total || 0,
          sampleDoctors: responseWithoutDoctor.data?.slice(0, 5).map((p: any) => ({
            Doctor: p.Doctor,
            Patient: p.Patient,
            Medicine: p.Medicine,
          })) || [],
        });
        
        // If we have prescriptions but doctor name doesn't match, show them anyway for debugging
        // This helps identify doctor name matching issues
        if (responseWithoutDoctor.data && responseWithoutDoctor.data.length > 0) {
          // eslint-disable-next-line no-console
          console.warn("[Prescriptions] Found prescriptions in DB but doctor name filter didn't match.");
          // eslint-disable-next-line no-console
          console.warn("[Prescriptions] Searching for:", doctorName);
          // eslint-disable-next-line no-console
          console.warn("[Prescriptions] Found doctor names:", responseWithoutDoctor.data.map((p: any) => p.Doctor));
          
          // Still use the filtered response (empty) to maintain proper filtering
          // But log the mismatch for debugging
        }
      } else if (!doctorName) {
        // If no doctor name, fetch all prescriptions (for debugging/admin view)
        // eslint-disable-next-line no-console
        console.log("[Prescriptions] No doctor name set, fetching all prescriptions...");
        response = await fetchPrescriptions({
          page: hasMultipleFilters ? 1 : page,
          limit: hasMultipleFilters ? 1000 : pageSize,
          sort: sortParam,
          search: searchText || undefined,
          status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
          date: selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : undefined,
        });
      }
      
      // Apply client-side filtering
      let filteredData = response.data || [];
      
      if (hasMultipleFilters) {
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
          const filterDate = dayjs(selectedDate).format("YYYY-MM-DD");
          filteredData = filteredData.filter((p) => {
            try {
              const prescDate = dayjs(p.Date || p.Prescribed_On).format("YYYY-MM-DD");
              return prescDate === filterDate;
            } catch {
              return false;
            }
          });
        }
        
        // Apply client-side pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        setPrescriptions(paginatedData);
        setTotal(filteredData.length);
      } else {
        // Apply date filter client-side if needed
        if (selectedDate) {
          const filterDate = dayjs(selectedDate).format("YYYY-MM-DD");
          filteredData = filteredData.filter((p) => {
            try {
              const prescDate = dayjs(p.Date || p.Prescribed_On).format("YYYY-MM-DD");
              return prescDate === filterDate;
            } catch {
              return false;
            }
          });
        }
        
        setPrescriptions(filteredData);
        setTotal(response.pagination?.total || filteredData.length);
      }
      
      // eslint-disable-next-line no-console
      console.log("[Prescriptions] Final result:", {
        prescriptionsCount: filteredData.length,
        total,
        page,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load prescriptions");
      setPrescriptions([]);
      setTotal(0);
      // eslint-disable-next-line no-console
      console.error("[Prescriptions] Failed to load prescriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorName, page, pageSize, searchText, selectedStatuses, selectedDoctors, selectedDate, sortBy, user]);

  useEffect(() => {
    // Load prescriptions even if doctorName is not set yet (will retry)
    const timer = setTimeout(() => {
      loadPrescriptions();
    }, searchText ? 500 : 0);

    return () => clearTimeout(timer);
  }, [loadPrescriptions, doctorName, searchText]);

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
      width: 150,
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
      width: 180,
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
      title: "Medicine",
      dataIndex: "Medicine",
      width: 200,
      render: (text: string) => (
        <span className="fw-medium">{text || "N/A"}</span>
      ),
      sorter: (a: any, b: any) => (a.Medicine || "").localeCompare(b.Medicine || ""),
    },
    {
      title: "Dosage",
      dataIndex: "Dosage",
      width: 120,
      render: (text: string) => (
        <span className="text-body">{text || "N/A"}</span>
      ),
    },
    {
      title: "Frequency",
      dataIndex: "Frequency",
      width: 120,
      render: (text: string) => (
        <span className="text-body">{text || "N/A"}</span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "Duration",
      width: 120,
      render: (text: string) => (
        <span className="text-body">{text || "N/A"}</span>
      ),
    },
    {
      title: "Prescribed On",
      dataIndex: "Prescribed_On",
      width: 150,
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
      title: "Status",
      dataIndex: "Status",
      width: 120,
      render: (text: string) => {
        const getStatusClass = (status: string) => {
          if (status === "Active") return "badge-soft-success text-success";
          if (status === "Completed") return "badge-soft-primary text-primary";
          if (status === "Cancelled") return "badge-soft-danger text-danger";
          return "badge-soft-secondary text-secondary";
        };
        
        return (
          <span className={`badge ${getStatusClass(text)} rounded fw-medium fs-13`}>
            {text || "N/A"}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.Status || "").localeCompare(b.Status || ""),
    },
    {
      title: "Actions",
      width: 100,
      render: (_: any, record: Prescription) => (
        <div className="action-item d-flex align-items-center gap-2">
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-sm btn-outline-secondary"
              data-bs-toggle="dropdown"
              title="More options"
            >
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu dropdown-menu-end p-2">
              <li>
                <Link
                  to={`${all_routes.doctorsprescriptiondetails}?id=${record._id || record.id}`}
                  className="dropdown-item d-flex align-items-center"
                >
                  <i className="ti ti-eye me-2" />
                  View Details
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
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
                  <i className="ti ti-trash me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
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
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <i className="ti ti-file-off fs-48 text-muted mb-3 d-block" />
                <p className="text-muted fw-semibold mb-2">No prescriptions found</p>
                <p className="text-muted fs-13 mb-3">
                  {searchText || selectedStatuses.length > 0 || selectedDoctors.length > 0 || selectedDate
                    ? "Try adjusting your filters"
                    : "Prescriptions will appear here after completing consultations with medications."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Datatable
                  columns={columns}
                  dataSource={tableData}
                  Selection={false}
                  searchText={searchText}
                />
              </div>
              {total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <div className="text-muted fs-13">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} prescriptions
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={page === 1 || loading}
                      onClick={() => setPage(page - 1)}
                      title="Previous page"
                    >
                      <i className="ti ti-chevron-left me-1" />
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="d-flex gap-1">
                      {(() => {
                        const totalPages = Math.ceil(total / pageSize);
                        const maxVisiblePages = 5;
                        const pages: (number | string)[] = [];
                        
                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if total pages is less than max
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Show first page
                          pages.push(1);
                          
                          // Calculate start and end of visible page range
                          let start = Math.max(2, page - 1);
                          let end = Math.min(totalPages - 1, page + 1);
                          
                          // Adjust if we're near the start
                          if (page <= 3) {
                            end = Math.min(maxVisiblePages - 1, totalPages - 1);
                          }
                          
                          // Adjust if we're near the end
                          if (page >= totalPages - 2) {
                            start = Math.max(2, totalPages - maxVisiblePages + 2);
                          }
                          
                          // Add ellipsis after first page if needed
                          if (start > 2) {
                            pages.push("...");
                          }
                          
                          // Add page numbers in range
                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }
                          
                          // Add ellipsis before last page if needed
                          if (end < totalPages - 1) {
                            pages.push("...");
                          }
                          
                          // Show last page
                          pages.push(totalPages);
                        }
                        
                        return pages.map((pageNum, idx) => {
                          if (pageNum === "...") {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-muted">
                                ...
                              </span>
                            );
                          }
                          
                          const pageNumber = pageNum as number;
                          const isActive = pageNumber === page;
                          
                          return (
                            <button
                              key={pageNumber}
                              className={`btn btn-sm ${isActive ? "btn-primary" : "btn-outline-primary"}`}
                              disabled={loading}
                              onClick={() => setPage(pageNumber)}
                              title={`Go to page ${pageNumber}`}
                            >
                              {pageNumber}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={page * pageSize >= total || loading}
                      onClick={() => setPage(page + 1)}
                      title="Next page"
                    >
                      Next
                      <i className="ti ti-chevron-right ms-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2026©
            <Link to="#" className="link-primary">
              Zaptas
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
