import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useState, useEffect, useCallback } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { fetchPatients, type Patient } from "../../../../../api/patients";
import { fetchDoctors, type Doctor } from "../../../../../api/doctors";

const Patients = () => {
  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchText, setSearchText] = useState<string>("");
  const [filters, setFilters] = useState({
    status: "",
    doctor: "",
    date: "",
  });
  const [sortBy, setSortBy] = useState("Recent");
  const [page] = useState(1);
  const [limit] = useState(100);
  
  // For filter dropdowns
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const columns = [
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={all_routes.patientDetails}
            className="avatar avatar-md me-2"
          >
            <ImageWithBasePath
              src={`assets/img/users/${render.Patient_img || "user-33.jpg"}`}
              alt="product"
              className="rounded-circle"
            />
          </Link>
          <Link
            to={all_routes.patientDetails}
            className="text-dark fw-semibold"
          >
            {text}
            <span className="text-body fs-13 fw-normal d-block">
              {render.Gender}
            </span>
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.length - b.Patient.length,
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: any, b: any) => a.Patient.length - b.Patient.length,
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={all_routes.doctorsDetails}
            className="avatar me-2 flex-shrink-0"
          >
            <ImageWithBasePath
              src={`assets/img/doctors/${render.Doctor_img || "doctor-01.jpg"}`}
              alt="img"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="fs-14 mb-1">
              <Link to={all_routes.doctorsDetails} className="fw-semibold">
                {text}
              </Link>
            </h6>
            <p className="mb-0 fs-13">{render.Role}</p>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Doctor.length - b.Doctor.length,
    },
    {
      title: "Address",
      dataIndex: "Address",
      render: (text: any) => text || "-",
      sorter: (a: any, b: any) => (a.Address || "").length - (b.Address || "").length,
    },
    {
      title: "Last Visit",
      dataIndex: "Last_Visit",
      render: (text: any) => text || "-",
      sorter: (a: any, b: any) => (a.Last_Visit || "").length - (b.Last_Visit || "").length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any) => (
        <span
          className={`badge rounded fs-13 fw-medium 
    ${
      text === "Available"
        ? "badge-soft-success text-success border-success border"
        : "badge-soft-danger text-danger border-danger border"
    }`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: () => (
        <div className="d-flex align-items-center gap-1">
          <Link
            to={all_routes.appointments}
            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
          >
            <i className="ti ti-calendar-cog" />
          </Link>
          <Link
            to="#"
            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
            data-bs-toggle="dropdown"
          >
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to={all_routes.editPatient}
                className="dropdown-item d-flex align-items-center"
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to={all_routes.patientDetails}
                className="dropdown-item d-flex align-items-center"
              >
                View
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_modal"
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
  ];
  // Load doctors for filter dropdown
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsRes = await fetchDoctors({ limit: 100, sort: "Name_Designation" });
        const doctorsList = Array.isArray(doctorsRes) ? doctorsRes : doctorsRes.data || [];
        setDoctors(doctorsList);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load doctors:", err);
      }
    };
    loadDoctors();
  }, []);

  // Load patients data
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = sortBy === "Recent" ? "-createdAt" : "createdAt";
      
      const response = await fetchPatients({
        page,
        limit: 100, // Get more data for client-side filtering
        sort: sortParam,
        search: searchText,
        status: selectedStatuses.length > 0 ? selectedStatuses[0] : filters.status,
      });

      // Apply additional client-side filters if needed
      let filteredData = response.data;
      
      if (selectedDoctors.length > 0) {
        filteredData = filteredData.filter((p) =>
          selectedDoctors.some((doc) => p.Doctor?.includes(doc))
        );
      }
      
      if (selectedPatients.length > 0) {
        filteredData = filteredData.filter((p) =>
          selectedPatients.includes(p.Patient)
        );
      }

      setData(filteredData);
      setTotalPatients(response.pagination.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load patients");
      // eslint-disable-next-line no-console
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, searchText, filters, selectedDoctors, selectedPatients, selectedStatuses]);

  // Initial load and when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, searchText ? 500 : 0); // Debounce only for search

    return () => clearTimeout(timer);
  }, [loadPatients, searchText, sortBy, selectedDoctors, selectedPatients, selectedStatuses]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleClearFilters = () => {
    setFilters({ status: "", doctor: "", date: "" });
    setSelectedPatients([]);
    setSelectedDoctors([]);
    setSelectedStatuses([]);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
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
              <h4 className="fw-bold mb-0">
                Patients List
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {loading ? "..." : totalPatients}
                </span>
              </h4>
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
                  to={all_routes.patients}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  to={all_routes.patientsGrid}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div>
              <Link
                to={all_routes.createPatient}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Patient
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/*  Start Filter */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap">
            <div>
              <div className="search-set mb-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className={`bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal ${selectedPatients.length > 0 || selectedDoctors.length > 0 || selectedStatuses.length > 0 ? "border-primary" : ""}`}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter text-gray-5 me-1" />
                  Filters
                  {(selectedPatients.length > 0 || selectedDoctors.length > 0 || selectedStatuses.length > 0) && (
                    <span className="badge bg-primary ms-2">{selectedPatients.length + selectedDoctors.length + selectedStatuses.length}</span>
                  )}
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
                          <label className="form-label">Patient</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="true"
                          >
                            Select <i className="ti ti-chevron-down ms-auto" />
                          </Link>
                          <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                            <div className="mb-3">
                              <div className="input-icon-start input-icon position-relative">
                                <span className="input-icon-addon fs-12">
                                  <i className="ti ti-search" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control form-control-md"
                                  placeholder="Search"
                                />
                              </div>
                            </div>
                            <ul className="mb-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                              {data.slice(0, 20).map((patient) => (
                                <li key={patient._id || patient.id} className="mb-1">
                                  <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                    <input
                                      className="form-check-input m-0 me-2"
                                      type="checkbox"
                                      checked={selectedPatients.includes(patient.Patient)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedPatients([...selectedPatients, patient.Patient]);
                                        } else {
                                          setSelectedPatients(selectedPatients.filter((p) => p !== patient.Patient));
                                        }
                                      }}
                                    />
                                    <span className="avatar avatar-xs rounded-circle me-2">
                                      <ImageWithBasePath
                                        src={`assets/img/users/${patient.Patient_img || "user-33.jpg"}`}
                                        className="flex-shrink-0 rounded-circle"
                                        alt="img"
                                      />
                                    </span>
                                    {patient.Patient}
                                  </label>
                                </li>
                              ))}
                            </ul>
                            <div className="row g-2">
                              <div className="col-6">
                                <Link
                                  to="#"
                                  className="btn btn-outline-white w-100 close-filter"
                                >
                                  Cancel
                                </Link>
                              </div>
                              <div className="col-6">
                                <Link to="#" className="btn btn-primary w-100">
                                  Select
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Doctor</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="true"
                          >
                            Select <i className="ti ti-chevron-down ms-auto" />
                          </Link>
                          <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                            <div className="mb-3">
                              <div className="input-icon-start input-icon position-relative">
                                <span className="input-icon-addon fs-12">
                                  <i className="ti ti-search" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control form-control-md"
                                  placeholder="Search"
                                />
                              </div>
                            </div>
                            <ul className="mb-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                              {doctors.slice(0, 20).map((doctor) => (
                                <li key={doctor._id || doctor.id} className="mb-1">
                                  <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                    <input
                                      className="form-check-input m-0 me-2"
                                      type="checkbox"
                                      checked={selectedDoctors.includes(doctor.Name_Designation || doctor.Doctor || "")}
                                      onChange={(e) => {
                                        const doctorName = doctor.Name_Designation || doctor.Doctor || "";
                                        if (e.target.checked) {
                                          setSelectedDoctors([...selectedDoctors, doctorName]);
                                        } else {
                                          setSelectedDoctors(selectedDoctors.filter((d) => d !== doctorName));
                                        }
                                      }}
                                    />
                                    <span className="avatar avatar-xs rounded-circle me-2">
                                      <ImageWithBasePath
                                        src={`assets/img/doctors/${doctor.img || "doctor-01.jpg"}`}
                                        className="flex-shrink-0 rounded-circle"
                                        alt="img"
                                      />
                                    </span>
                                    {doctor.Name_Designation || doctor.Doctor}
                                  </label>
                                </li>
                              ))}
                            </ul>
                            <div className="row g-2">
                              <div className="col-6">
                                <Link
                                  to="#"
                                  className="btn btn-outline-white w-100 close-filter"
                                >
                                  Cancel
                                </Link>
                              </div>
                              <div className="col-6">
                                <Link to="#" className="btn btn-primary w-100">
                                  Select
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Designation</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="true"
                          >
                            Select <i className="ti ti-chevron-down ms-auto" />
                          </Link>
                          <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                            <div className="mb-3">
                              <div className="input-icon-start input-icon position-relative">
                                <span className="input-icon-addon fs-12">
                                  <i className="ti ti-search" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control form-control-md"
                                  placeholder="Search"
                                />
                              </div>
                            </div>
                            <ul className="mb-3">
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Cardiologist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Orthopedic Surgeon
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Pediatrician
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Gynecologist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Psychiatrist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Neurosurgeon
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Oncologist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Pulmonologist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Urologist
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  Dermatologist
                                </label>
                              </li>
                            </ul>
                            <div className="row g-2">
                              <div className="col-6">
                                <Link
                                  to="#"
                                  className="btn btn-outline-white w-100 close-filter"
                                >
                                  Cancel
                                </Link>
                              </div>
                              <div className="col-6">
                                <Link to="#" className="btn btn-primary w-100">
                                  Select
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Date<span className="text-danger">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <input
                            type="text"
                            className="form-control bookingrange"
                            placeholder="dd/mm/yyyy"
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Status</label>
                          <Link to="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="true"
                          >
                            Select <i className="ti ti-chevron-down ms-auto" />
                          </Link>
                          <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                            <ul className="mb-3">
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                    checked={selectedStatuses.includes("Available")}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStatuses([...selectedStatuses.filter((s) => s !== "Unavailable"), "Available"]);
                                      } else {
                                        setSelectedStatuses(selectedStatuses.filter((s) => s !== "Available"));
                                      }
                                    }}
                                  />
                                  Available
                                </label>
                              </li>
                              <li className="mb-0">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                    checked={selectedStatuses.includes("Unavailable")}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStatuses([...selectedStatuses.filter((s) => s !== "Available"), "Unavailable"]);
                                      } else {
                                        setSelectedStatuses(selectedStatuses.filter((s) => s !== "Unavailable"));
                                      }
                                    }}
                                  />
                                  Unavailable
                                </label>
                              </li>
                            </ul>
                            <div className="row g-2">
                              <div className="col-6">
                                <Link
                                  to="#"
                                  className="btn btn-outline-white w-100 close-filter"
                                >
                                  Cancel
                                </Link>
                              </div>
                              <div className="col-6">
                                <Link to="#" className="btn btn-primary w-100">
                                  Select
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <Link
                        to="#"
                        className="btn btn-light btn-md me-2 fw-medium"
                        id="close-filter"
                      >
                        Close
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btn-md fw-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          loadPatients();
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
          {/*  End Filter */}
          {/*  Start Table */}
          {loading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading patients...</p>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                searchText={""}
              />
            </div>
          )}
          {/*  End Table */}
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

export default Patients;
