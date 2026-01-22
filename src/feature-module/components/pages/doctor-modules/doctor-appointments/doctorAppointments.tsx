import { Link } from "react-router";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { useState, useEffect, useCallback, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import PredefinedDatePicker from "../../../../../core/common/datePicker";
import { DatePicker, Select } from "antd";
import { Status } from "../../../../../core/common/selectOption";
import { all_routes } from "../../../../routes/all_routes";
import Modal from "./modal/modals";
import { useAuth } from "../../../../../core/context/AuthContext";
import {
  fetchAppointments,
  deleteAppointment,
  type Appointment,
} from "../../../../../api/appointments";
import { fetchDoctors } from "../../../../../api/doctors";
import dayjs from "dayjs";

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Filter states
  const [searchText, setSearchText] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [sortBy, setSortBy] = useState<string>("Recent");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

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
          setDoctorName(doctor.Name_Designation || "");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to find doctor:", err);
      }
    };
    
    findDoctor();
  }, [user]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!doctorName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = sortBy === "Recent" ? "-createdAt" : sortBy === "Ascending" ? "createdAt" : "-createdAt";
      
      // Fetch all appointments for the doctor (we'll filter client-side for multiple selections)
      const response = await fetchAppointments({
        page: 1,
        limit: 1000, // Get more data for client-side filtering
        sort: sortParam,
        search: searchText || undefined,
        status: selectedStatus.length === 1 ? selectedStatus[0] : undefined,
        mode: selectedMode.length === 1 ? selectedMode[0] : undefined,
        doctor: doctorName,
      });
      
      // Apply client-side filtering for multiple selections
      let filteredData = response.data || [];
      
      if (selectedStatus.length > 1) {
        filteredData = filteredData.filter((appt) => selectedStatus.includes(appt.Status));
      }
      
      if (selectedMode.length > 1) {
        filteredData = filteredData.filter((appt) => selectedMode.includes(appt.Mode || ""));
      }
      
      // Apply date filter if selected
      if (selectedDate) {
        const filterDate = selectedDate.format("YYYY-MM-DD");
        filteredData = filteredData.filter((appt) => {
          try {
            const apptDate = dayjs(appt.Date_Time).format("YYYY-MM-DD");
            return apptDate === filterDate;
          } catch {
            return false;
          }
        });
      }
      
      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setAppointments(paginatedData);
      setTotal(filteredData.length);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load appointments");
      // eslint-disable-next-line no-console
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorName, page, pageSize, searchText, selectedStatus, selectedMode, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (doctorName) {
        loadAppointments();
      }
    }, searchText ? 500 : 0);

    return () => clearTimeout(timer);
  }, [loadAppointments, doctorName]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleDelete = async (appointment: Appointment) => {
    if (!window.confirm(`Are you sure you want to delete appointment for ${appointment.Patient}?`)) {
      return;
    }

    try {
      const appointmentId = appointment._id || appointment.id;
      if (!appointmentId) {
        alert("Invalid appointment ID");
        return;
      }
      
      await deleteAppointment(appointmentId);
      alert("Appointment deleted successfully");
      loadAppointments();
    } catch (err: any) {
      alert(`Failed to delete appointment: ${err?.response?.data?.message || err?.message || "Unknown error"}`);
      // eslint-disable-next-line no-console
      console.error("Failed to delete appointment:", err);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return dayjs(dateTimeStr).format("DD MMM YYYY, hh:mm A");
    } catch {
      return dateTimeStr;
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus([]);
    setSelectedMode([]);
    setSelectedDate(null);
    setSearchText("");
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1);
  };

  // Transform appointments for table
  const tableData = useMemo(() => {
    return appointments.map((appt) => ({
      ...appt,
      key: appt._id || appt.id,
      img: appt.Patient_Image || "user-01.jpg",
      phone_number: appt.Phone,
    }));
  }, [appointments]);
  const columns = [
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      render: (text: string) => formatDateTime(text),
      sorter: (a: any, b: any) => {
        const dateA = new Date(a.Date_Time).getTime();
        const dateB = new Date(b.Date_Time).getTime();
        return dateA - dateB;
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
              alt={text}
              className="rounded-circle"
            />
          </Link>
          <Link to={all_routes.doctorspatientdetails} className="fw-semibold">
            {text}
            <span className="text-body fs-13 fw-normal d-block">
              {record.Phone || record.phone_number || "N/A"}
            </span>
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => (a.Patient || "").localeCompare(b.Patient || ""),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      render: (text: string) => text || "In-Person",
      sorter: (a: any, b: any) => (a.Mode || "").localeCompare(b.Mode || ""),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${
            text === "Checked Out"
              ? "badge-soft-primary "
              : text === "Checked In"
              ? "badge-soft-warning"
              : text === "Confirmed"
              ? "badge-soft-success"
              : text === "Schedule" || text === "Scheduled"
              ? "badge-soft-info"
              : "badge-soft-danger"
          } rounded ${
            text === "Checked Out"
              ? "text-primary"
              : text === "Checked In"
              ? "text-warning"
              : text === "Confirmed"
              ? "text-success"
              : text === "Schedule" || text === "Scheduled"
              ? "text-info"
              : "text-danger"
          }  fw-medium fs-13`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => (a.Status || "").localeCompare(b.Status || ""),
    },
    {
      title: "Actions",
      render: (record: Appointment) => (
        <div className="action-item d-flex align-items-center gap-2">
          {record.Status !== "Checked Out" && record.Status !== "Cancelled" && (
            <Link
              to={`${all_routes.onlineconsultations}?appointmentId=${record._id || record.id}`}
              className="btn btn-sm btn-primary"
              title="Start Consultation"
            >
              <i className="ti ti-calendar-plus" />
            </Link>
          )}
          <Link
            to="#"
            data-bs-toggle="dropdown"
            onClick={(e) => {
              e.preventDefault();
              setSelectedAppointment(record);
            }}
          >
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="offcanvas"
                data-bs-target="#edit_appointment"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedAppointment(record);
                }}
              >
                <i className="ti ti-edit me-2" />
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="offcanvas"
                data-bs-target="#view_details"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedAppointment(record);
                }}
              >
                <i className="ti ti-eye me-2" />
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
                <i className="ti ti-trash me-2" />
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

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
              <h4 className="fw-semibold mb-0"> Appointment </h4>
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
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  to={all_routes.doctorsappointments}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  to={all_routes.doctorsappointmentdetails}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-calendar-event fs-14 text-body" />
                </Link>
              </div>
              <Link
                to="#"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="offcanvas"
                data-bs-target="#new_appointment"
              >
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/*  Start Filter */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="d-flex align-items-center gap-2">
              <div className="search-set mb-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex right-content align-items-center flex-wrap mb-3">
                <div className="input-icon-start position-relative">
                  <span className="input-icon-addon text-dark">
                    <i className="ti ti-calendar-event" />
                  </span>
                  <PredefinedDatePicker />
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadAppointments();
                    }}
                  >
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label mb-1">Status</label>
                          <Link
                            to="#"
                            className="link-primary mb-1"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedStatus([]);
                            }}
                          >
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedStatus}
                          onChange={(values) => {
                            setSelectedStatus(values as string[]);
                            setPage(1);
                          }}
                          options={Status}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Mode</label>
                          <Link
                            to="#"
                            className="link-primary mb-1"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedMode([]);
                            }}
                          >
                            Reset
                          </Link>
                        </div>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          value={selectedMode}
                          onChange={(values) => {
                            setSelectedMode(values as string[]);
                            setPage(1);
                          }}
                          options={[
                            { label: "Online", value: "Online" },
                            { label: "In-Person", value: "In-Person" },
                          ]}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Date
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
                            value={selectedDate ? dayjs(selectedDate) : null}
                            onChange={(date) => {
                              setSelectedDate(date);
                              setPage(1);
                            }}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
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
                        type="submit"
                        className="btn btn-primary btn-md fw-medium"
                      >
                        Apply Filters
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
                  <span className="me-1"> Sort By : </span>{" "}
                  {sortBy === "Recent"
                    ? "Recently Added"
                    : sortBy === "Ascending"
                    ? "Ascending"
                    : "Descending"}
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
                      Recently Added
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("Ascending");
                      }}
                    >
                      Ascending
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("Descending");
                      }}
                    >
                      Descending
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/*  End Filter */}
          {/*  Start Table */}
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="mb-0">Loading appointments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <p className="text-danger fw-semibold mb-3">{error}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => loadAppointments()}
                >
                  Retry
                </button>
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
              {total > pageSize && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} appointments
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={page * pageSize >= total}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {/*  End Table */}
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
      <Modal
        selectedAppointment={selectedAppointment}
        onAppointmentUpdated={loadAppointments}
      />
    </>
  );
};

export default DoctorAppointments;
