import { DatePicker, Select } from "antd";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { Link, useNavigate } from "react-router";
import Modals from "./modals/modals";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { fetchDoctors, deleteDoctor, type Doctor as DoctorType } from "../../../../../api/doctors";

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorType | null>(null);
  const limit = 15; // Number of doctors per page

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  useEffect(() => {
    loadDoctors(1);
  }, []);

  const loadDoctors = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetchDoctors({
        page: pageNum,
        limit,
        sort: "-createdAt",
      });

      // Handle both array and paginated response
      let doctorsData: DoctorType[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        doctorsData = response;
        total = response.length;
      } else {
        // If backend returns paginated response
        const paginatedResponse = response as any;
        doctorsData = paginatedResponse.data || [];
        total = paginatedResponse.pagination?.total || paginatedResponse.total || doctorsData.length;
      }

      if (append) {
        setDoctors((prev) => [...prev, ...doctorsData]);
      } else {
        setDoctors(doctorsData);
        setTotalDoctors(total);
      }

      setHasMore(doctorsData.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      alert("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadDoctors(page + 1, true);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoctor) return;

    try {
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      if (!doctorId) {
        alert("Doctor ID not found");
        return;
      }

      await deleteDoctor(doctorId);
      alert("Doctor deleted successfully");
      
      // Remove from list
      setDoctors((prev) => prev.filter((d) => (d._id || d.id) !== doctorId));
      setTotalDoctors((prev) => prev - 1);
      setSelectedDoctor(null);
      
      // Close modal
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      }
    } catch (error: any) {
      console.error("Failed to delete doctor:", error);
      alert(`Failed to delete doctor: ${error.response?.data?.message || error.message || "Unknown error"}`);
    }
  };

  const handleEditClick = (doctor: DoctorType) => {
    setSelectedDoctor(doctor);
    // Navigate to edit page or open edit modal
    navigate(`${all_routes.editDoctors}?id=${doctor._id || doctor.id}`);
  };

  const handleDeleteClick = (doctor: DoctorType) => {
    setSelectedDoctor(doctor);
  };


  const getDoctorImage = (doctor: DoctorType) => {
    if (doctor.img) {
      return `assets/img/doctors/${doctor.img}`;
    }
    // Default image based on index or random
    const index = doctors.indexOf(doctor) % 15;
    return `assets/img/doctors/doctor-${String(index + 1).padStart(2, "0")}.jpg`;
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
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Doctor Grid
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {loading ? "..." : totalDoctors}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"
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
                    <h4 className="mb-0">Filter</h4>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="link-danger text-decoration-underline"
                      >
                        Clear All
                      </Link>
                    </div>
                  </div>
                  <form action="#">
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Doctor</label>
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
                          defaultValue={[]}
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
                          defaultValue={[]}
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
                          defaultValue={[]}
                          options={Status}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <Link
                        to="#"
                        className="btn btn-light btn-md me-2"
                        id="close-filter"
                      >
                        Close
                      </Link>
                      <button type="submit" className="btn btn-primary btn-md">
                        Filter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  to={all_routes.doctorsList}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-body" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div>
              <Link
                to={all_routes.addDoctors}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Doctor
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {loading && doctors.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
                  </div>
              <p className="mt-3 text-muted">Loading doctors...</p>
                      </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No doctors found.</p>
              <Link to={all_routes.addDoctors} className="btn btn-primary mt-3">
                Add First Doctor
                      </Link>
                    </div>
          ) : (
            <div className="row">
              {doctors.map((doctor, index) => {
                const doctorId = doctor._id || doctor.id || "";
                const doctorName = doctor.Name_Designation || "Unknown Doctor";
                const designation = doctor.role || doctor.Department || "Doctor";
                const fees = doctor.Fees || doctor.consultationCharge || "$0";
                const availableDate = doctor.schedules?.[0]?.day || "N/A";
                
                return (
                  <div key={doctorId || index} className="col-xl-4 col-md-6 mb-3">
              <div className="card">
                <div className="card-body d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3">
                  <div className="me-3 doctor-profile-img">
                          <Link to={`${all_routes.doctordetails}?id=${doctorId}`}>
                      <ImageWithBasePath
                              src={getDoctorImage(doctor)}
                        className="rounded"
                              alt={doctorName}
                      />
                    </Link>
                  </div>
                  <div className="flex-fill">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <h6 className="mb-0 fw-semibold">
                              <Link to={`${all_routes.doctordetails}?id=${doctorId}`}>
                                {doctorName}
                        </Link>
                      </h6>
                      <div className="action-item">
                        <Link to="#" data-bs-toggle="dropdown">
                          <i className="ti ti-dots-vertical" />
                        </Link>
                        <ul className="dropdown-menu">
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item d-flex align-items-center"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEditClick(doctor);
                                    }}
                            >
                              Edit
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item d-flex align-items-center"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteClick(doctor);
                                      const modal = document.getElementById("delete_modal");
                                      if (modal) {
                                        const bsModal = new (window as any).bootstrap.Modal(modal);
                                        bsModal.show();
                                      }
                                    }}
                            >
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                          <span className="d-block mb-2 fs-13">{designation}</span>
                          <p className="mb-2 fs-13">
                            Available : {availableDate}
                          </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="text-primary fs-14 mb-0">
                        <span className="text-muted fs-13 fw-normal">
                          Starts From :
                        </span>
                              {fees}
                      </h6>
                      <Link
                        to={all_routes.appointmentCalendar}
                        className="avatar avatar-xs border text-muted fs-14"
                      >
                        <i className="ti ti-calendar-cog" />
                      </Link>
                    </div>
                  </div>
                </div>
                {/* end card body */}
              </div>
              {/* end card */}
            </div>
                );
              })}
                  </div>
          )}
          {doctors.length > 0 && (
            <div className="text-center mt-4">
              {loadingMore ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                      </div>
              ) : hasMore ? (
                            <Link
                              to="#"
                  className="btn btn-white bg-white text-dark fs-13"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoadMore();
                  }}
                >
              Load More
            </Link>
              ) : (
                <p className="text-muted">No more doctors to load</p>
              )}
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
      <Modals 
        selectedDoctor={selectedDoctor}
        onDelete={handleDelete}
      />
    </>
  );
};

export default Doctors;
