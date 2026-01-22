import { Link, useSearchParams, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Appointment_Type,
  Blood_Group,
  City,
  Country,
  Department,
  Designation,
  Gender,
  State,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import TagInput from "../../../../../core/common/Taginput";
import { useState, useEffect } from "react";
import DuplicateForms from "../../../../../core/common/duplicate-forms/duplicateForms";
import EducationForms from "../../../../../core/common/duplicate-forms/educationForm";
import RewardsForms from "../../../../../core/common/duplicate-forms/rewardsForm";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { fetchDoctorById, updateDoctor, type Doctor } from "../../../../../api/doctors";

const EditDoctor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  
  const [formData, setFormData] = useState({
    Name_Designation: "",
    username: "",
    Phone: "",
    Email: "",
    dob: null as Dayjs | null,
    yearOfExperience: "",
    Department: "",
    Designation: "",
    medicalLicenseNumber: "",
    languageSpoken: [] as string[],
    Blood_Group: "",
    Gender: "",
    bio: "",
    featureOnWebsite: false,
    address1: "",
    address2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    appointmentType: "",
    acceptBookingsInAdvance: "",
    appointmentDuration: "",
    consultationCharge: "",
    maxBookingsPerSlot: "",
    displayOnBookingPage: false,
    schedules: [] as any[],
    education: [] as any[],
    awards: [] as any[],
    certifications: [] as any[],
  });
  
  const [phone, setPhone] = useState<string | undefined>();
  const [profileImage, setProfileImage] = useState<string>("");

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };
  
  // Fetch doctor data
  useEffect(() => {
    const loadDoctor = async () => {
      if (!doctorId) {
        setError("Doctor ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const doctorData = await fetchDoctorById(doctorId);
        setDoctor(doctorData);
        
        // Populate form with doctor data
        setFormData({
          Name_Designation: doctorData.Name_Designation || "",
          username: doctorData.username || "",
          Phone: doctorData.Phone || "",
          Email: doctorData.Email || "",
          dob: doctorData.dob ? dayjs(doctorData.dob, "DD-MM-YYYY") : null,
          yearOfExperience: doctorData.yearOfExperience || "",
          Department: doctorData.Department || "",
          Designation: doctorData.role || "",
          medicalLicenseNumber: doctorData.medicalLicenseNumber || "",
          languageSpoken: doctorData.languageSpoken || [],
          Blood_Group: doctorData.bloodGroup || "",
          Gender: doctorData.gender || "",
          bio: doctorData.bio || "",
          featureOnWebsite: doctorData.featureOnWebsite || false,
          address1: doctorData.address1 || "",
          address2: doctorData.address2 || "",
          country: doctorData.country || "",
          state: doctorData.state || "",
          city: doctorData.city || "",
          pincode: doctorData.pincode || "",
          appointmentType: doctorData.appointmentType || "",
          acceptBookingsInAdvance: doctorData.acceptBookingsInAdvance || "",
          appointmentDuration: doctorData.appointmentDuration || "",
          consultationCharge: doctorData.consultationCharge || doctorData.Fees || "",
          maxBookingsPerSlot: doctorData.maxBookingsPerSlot || "",
          displayOnBookingPage: doctorData.displayOnBookingPage || false,
          schedules: doctorData.schedules || [],
          education: doctorData.education || [],
          awards: doctorData.awards || [],
          certifications: doctorData.certifications || [],
        });
        
        setPhone(doctorData.Phone);
        setProfileImage(doctorData.img || "assets/img/doctors/doctor-01.jpg");
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load doctor");
        // eslint-disable-next-line no-console
        console.error("Failed to load doctor:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctorId) {
      alert("Doctor ID is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Only include fields that have values to avoid validation errors
      const updateData: Partial<Doctor> = {
        ...(formData.Name_Designation && { Name_Designation: formData.Name_Designation }),
        ...(formData.username && { username: formData.username }),
        ...((phone || formData.Phone) && { Phone: phone || formData.Phone }),
        ...(formData.Email && { Email: formData.Email }),
        ...(formData.dob && { dob: formData.dob.format("DD-MM-YYYY") }),
        ...(formData.yearOfExperience && { yearOfExperience: formData.yearOfExperience }),
        ...(formData.Department && { Department: formData.Department }),
        ...(formData.Designation && { role: formData.Designation }),
        ...(formData.medicalLicenseNumber && { medicalLicenseNumber: formData.medicalLicenseNumber }),
        ...(formData.languageSpoken.length > 0 && { languageSpoken: formData.languageSpoken }),
        ...(formData.Blood_Group && { bloodGroup: formData.Blood_Group }),
        ...(formData.Gender && { gender: formData.Gender }),
        ...(formData.bio && { bio: formData.bio }),
        featureOnWebsite: formData.featureOnWebsite,
        ...(formData.address1 && { address1: formData.address1 }),
        ...(formData.address2 && { address2: formData.address2 }),
        ...(formData.country && { country: formData.country }),
        ...(formData.state && { state: formData.state }),
        ...(formData.city && { city: formData.city }),
        ...(formData.pincode && { pincode: formData.pincode }),
        ...(formData.appointmentType && { appointmentType: formData.appointmentType }),
        ...(formData.acceptBookingsInAdvance && { acceptBookingsInAdvance: formData.acceptBookingsInAdvance }),
        ...(formData.appointmentDuration && { appointmentDuration: formData.appointmentDuration }),
        ...(formData.consultationCharge && { consultationCharge: formData.consultationCharge, Fees: formData.consultationCharge }),
        ...(formData.maxBookingsPerSlot && { maxBookingsPerSlot: formData.maxBookingsPerSlot }),
        displayOnBookingPage: formData.displayOnBookingPage,
        ...(formData.schedules.length > 0 && { schedules: formData.schedules }),
        ...(formData.education.length > 0 && { education: formData.education }),
        ...(formData.awards.length > 0 && { awards: formData.awards }),
        ...(formData.certifications.length > 0 && { certifications: formData.certifications }),
        ...(profileImage && { img: profileImage }),
      };

      await updateDoctor(doctorId, updateData);
      // eslint-disable-next-line no-alert
      alert("Doctor updated successfully!");
      navigate(all_routes.doctors);
    } catch (err: any) {
      let errorMessage = "Failed to update doctor";
      
      if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
        errorMessage = "Network error: Please check if the backend server is running on http://localhost:4000";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // eslint-disable-next-line no-alert
      alert(`Failed to update doctor: ${errorMessage}`);
      // eslint-disable-next-line no-console
      console.error("Failed to update doctor:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading doctor data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            {error}
            <div className="mt-3">
              <Link to={all_routes.doctors} className="btn btn-primary">
                Back to Doctors
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              {/* Start Page Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.doctors}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Doctor
                    </Link>
                  </h6>
                </div>
              </div>
              {/* End Page Header */}
              {error && (
                <div className="alert alert-warning" role="alert">
                  {error}
                </div>
              )}
              {/* Start Add Doctor */}
              <div className="card">
                {/* <div class="card-header">
                          
                      </div> */}
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold">
                      Edit Doctor
                    </h5>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Contact Information</h6>
                    </div>
                    <div className="pb-0">
                      {/* start row*/}
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="mb-3 d-flex align-items-center">
                            <label className="form-label">Profile Image</label>
                            <div className="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                              <ImageWithBasePath
                                src={profileImage}
                                className="position-relative z-n1"
                                alt=""
                              />
                              <input
                                type="file"
                                className="form-control image-sign"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setProfileImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <div className="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                                <Link
                                  to="#"
                                  className="text-white d-flex align-items-center justify-content-center"
                                >
                                  <i className="ti ti-photo fs-14" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Name <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={formData.Name_Designation}
                                  onChange={(e) => setFormData({ ...formData, Name_Designation: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            {/* end col*/}
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Username
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={formData.username}
                                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            {/* end col*/}
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Phone Number
                                  <span className="text-danger">*</span>
                                </label>
 <PhoneInput
                            defaultCountry="US"
                            value={phone}
                            onChange={setPhone}
                          />
                              </div>
                            </div>
                            {/* end col*/}
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Email Address
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={formData.Email}
                                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            {/* end col*/}
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  DOB <span className="text-danger">*</span>
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
                                    value={formData.dob}
                                    onChange={(date) => setFormData({ ...formData, dob: date })}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Year Of Experience
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={formData.yearOfExperience}
                                  onChange={(e) => setFormData({ ...formData, yearOfExperience: e.target.value })}
                                  placeholder="e.g., +5 Years"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Department
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Department}
                                  className="select"
                                  value={formData.Department}
                                  onChange={(value) => setFormData({ ...formData, Department: value })}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Designation
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Designation}
                                  className="select"
                                  value={formData.Designation}
                                  onChange={(value) => setFormData({ ...formData, Designation: value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Medical License Number
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={formData.medicalLicenseNumber}
                                  onChange={(e) => setFormData({ ...formData, medicalLicenseNumber: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Language Spoken
                                </label>
                                <TagInput
                                  initialTags={formData.languageSpoken}
                                  onTagsChange={(tags) => setFormData({ ...formData, languageSpoken: tags })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Blood Group
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Blood_Group}
                                  className="select"
                                  value={formData.Blood_Group}
                                  onChange={(value) => setFormData({ ...formData, Blood_Group: value })}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Gender
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Gender}
                                  className="select"
                                  value={formData.Gender}
                                  onChange={(value) => setFormData({ ...formData, Gender: value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end col*/}
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Bio</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={formData.bio}
                              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                              placeholder="Enter doctor bio..."
                            />
                          </div>
                          <div className="form-check form-switch mb-3">
                            <label
                              className="form-check-label"
                              htmlFor="switchCheckDefault3"
                            >
                              Feature On Website
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="switchCheckDefault3"
                              checked={formData.featureOnWebsite}
                              onChange={(e) => setFormData({ ...formData, featureOnWebsite: e.target.checked })}
                            />
                          </div>
                        </div>
                      </div>
                      {/* end row*/}
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Address Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Address 1</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.address1}
                              onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Address 2 </label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.address1}
                              onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Country</label>
                            <CommonSelect
                              options={Country}
                              className="select"
                              value={formData.country}
                              onChange={(value) => setFormData({ ...formData, country: value })}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">City</label>
                            <CommonSelect
                              options={City}
                              className="select"
                              value={formData.city}
                              onChange={(value) => setFormData({ ...formData, city: value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">State</label>
                            <CommonSelect
                              options={State}
                              className="select"
                              value={formData.state}
                              onChange={(value) => setFormData({ ...formData, state: value })}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Pincode</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.pincode}
                              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Address Information</h6>
                    </div>
                    <div>
                      <ul
                        className="nav nav-pills schedule-tab mb-3"
                        id="pills-tab2"
                        role="tablist"
                      >
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto active"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-8"
                            type="button"
                            role="tab"
                            aria-selected="true"
                          >
                            Monday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-9"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Tuesday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-10"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Wednesday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-11"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Thursday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-12"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Friday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-13"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Saturday
                          </button>
                        </li>
                        <li className="nav-item me-1" role="presentation">
                          <button
                            className="nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto"
                            data-bs-toggle="pill"
                            data-bs-target="#schedules-14"
                            type="button"
                            role="tab"
                            aria-selected="false"
                            tabIndex={-1}
                          >
                            Sunday
                          </button>
                        </li>
                      </ul>
                      <div className="tab-content" id="pills-tabContent2">
                        <div
                          className="tab-pane fade active show"
                          id="schedules-8"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-9"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-10"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-11"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-12"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-13"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                        <div
                          className="tab-pane fade"
                          id="schedules-14"
                          role="tabpanel"
                        >
                          <div className="add-schedule-list">
                            <DuplicateForms />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <Link to="#" className="btn btn-dark">
                          Apply All
                        </Link>
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Appointment Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Appointment Type
                            </label>
                            <CommonSelect
                              options={Appointment_Type}
                              className="select"
                              value={formData.appointmentType}
                              onChange={(value) => setFormData({ ...formData, appointmentType: value })}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6" />
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Accept bookings (in Advance)
                            </label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={formData.acceptBookingsInAdvance}
                                onChange={(e) => setFormData({ ...formData, acceptBookingsInAdvance: e.target.value })}
                                min="1"
                              />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                Days
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Appointment Duration
                            </label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={formData.appointmentDuration}
                                onChange={(e) => setFormData({ ...formData, appointmentDuration: e.target.value })}
                                min="1"
                              />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                Mins
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Consultation Charge
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={formData.consultationCharge}
                                onChange={(e) => setFormData({ ...formData, consultationCharge: e.target.value })}
                                placeholder="$100"
                              />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                                $
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Max Bookings Per Slot
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.maxBookingsPerSlot}
                              onChange={(e) => setFormData({ ...formData, maxBookingsPerSlot: e.target.value })}
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check form-switch mb-3">
                            <label
                              className="form-check-label"
                              htmlFor="switchCheckDefault2"
                            >
                              Display on Booking Page
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="switchCheckDefault2"
                              checked={formData.displayOnBookingPage}
                              onChange={(e) => setFormData({ ...formData, displayOnBookingPage: e.target.checked })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Educational Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="add-education-list">
                        <EducationForms />
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Awards &amp; Recognition</h6>
                    </div>
                    <div className="pb-0">
                      <div className="add-award-list">
                        <RewardsForms />
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2">
                      <h6 className="fw-bold mb-0">Certifications</h6>
                    </div>
                    <div className="pb-3 mb-3 border-bottom">
                      <div className="add-certification-list">
                        <RewardsForms />
                      </div>
                    </div>
                    <div className=" d-flex justify-content-end gap-2">
                      <Link
                        to={all_routes.doctors}
                        className="btn btn-light btm-md"
                      >
                        Cancel
                      </Link>
                      <button 
                        type="submit" 
                        className="btn btn-primary btm-md"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
                {/* <div class="card-footer">
                          
                      </div> */}
              </div>
              {/* End Add Doctor */}
            </div>
          </div>
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

export default EditDoctor;
