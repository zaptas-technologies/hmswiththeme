import { Link, useSearchParams, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker, TimePicker } from "antd";
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
  Session,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import TagInput from "../../../../../core/common/Taginput";
import { useState, useEffect } from "react";
import EducationForms from "../../../../../core/common/duplicate-forms/educationForm";
import RewardsForms from "../../../../../core/common/duplicate-forms/rewardsForm";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { fetchDoctorById, updateDoctor, uploadDoctorImage, type Doctor, type DaySchedule } from "../../../../../api/doctors";
import { getApiOrigin } from "../../../../../api/dashboard";

interface ScheduleRow {
  id: number;
  session: string;
  from: Dayjs | null;
  to: Dayjs | null;
}

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
  const [password, setPassword] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Schedule (DoctorSchedule): metadata + per-day time slots
  const [scheduleLocation, setScheduleLocation] = useState("");
  const [scheduleFromDate, setScheduleFromDate] = useState<Dayjs | null>(null);
  const [scheduleToDate, setScheduleToDate] = useState<Dayjs | null>(null);
  const [scheduleRecursEvery, setScheduleRecursEvery] = useState("1 Week");
  const [schedulesByDay, setSchedulesByDay] = useState<Record<string, ScheduleRow[]>>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
  });

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

        // Populate schedule from scheduleDetail (DoctorSchedule)
        const sd = doctorData.scheduleDetail;
        if (sd) {
          setScheduleLocation(sd.location || "");
          setScheduleFromDate(sd.fromDate ? dayjs(sd.fromDate) : null);
          setScheduleToDate(sd.toDate ? dayjs(sd.toDate) : null);
          setScheduleRecursEvery(sd.recursEvery || "1 Week");
          const byDay: Record<string, ScheduleRow[]> = {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
          };
          (sd.schedules || []).forEach((s: { day: string; timeSlots: Array<{ session: string; from: string; to: string }> }) => {
            const day = s.day;
            if (byDay[day]) {
              byDay[day] = (s.timeSlots || []).map((slot, i) => ({
                id: Date.now() + i + Math.random(),
                session: slot.session || Session[0]?.value || "",
                from: slot.from ? dayjs(slot.from, "HH:mm") : null,
                to: slot.to ? dayjs(slot.to, "HH:mm") : null,
              }));
            }
          });
          setSchedulesByDay(byDay);
        }
        
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

  const handleScheduleChange = (day: string, rows: ScheduleRow[]) => {
    setSchedulesByDay(prev => ({ ...prev, [day]: rows }));
  };

  const convertScheduleToAPIFormat = (): DaySchedule[] => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days
      .map(day => {
        const dayRows = schedulesByDay[day] || [];
        if (dayRows.length === 0) return null;
        const timeSlots = dayRows
          .filter(row => row.from && row.to)
          .map(row => ({
            session: row.session || Session[0]?.value || "",
            from: row.from ? row.from.format("HH:mm") : "",
            to: row.to ? row.to.format("HH:mm") : "",
          }));
        if (timeSlots.length === 0) return null;
        return { day: day as DaySchedule["day"], timeSlots };
      })
      .filter((s): s is DaySchedule => s !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
      if (!doctorId) {
        alert("Doctor ID is required");
        return;
      }

      // Validate password if provided
      if (password && password.length < 6) {
        alert("Password must be at least 6 characters long");
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
        ...(password && { password }), // Include password if provided (for updating user account)
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
        ...(formData.education.length > 0 && { education: formData.education }),
        ...(formData.awards.length > 0 && { awards: formData.awards }),
        ...(formData.certifications.length > 0 && { certifications: formData.certifications }),
        ...(profileImage && { img: profileImage }),
      };

      const apiSchedules = convertScheduleToAPIFormat();
      if (scheduleLocation?.trim() && scheduleFromDate && scheduleToDate && apiSchedules.length > 0) {
        (updateData as any).scheduleLocation = scheduleLocation.trim();
        (updateData as any).scheduleFromDate = scheduleFromDate.format("YYYY-MM-DD");
        (updateData as any).scheduleToDate = scheduleToDate.format("YYYY-MM-DD");
        (updateData as any).scheduleRecursEvery = scheduleRecursEvery || "1 Week";
        (updateData as any).schedules = apiSchedules;
      }

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
                                src={profileImage.startsWith("/") ? getApiOrigin() + profileImage : profileImage}
                                className="position-relative z-n1"
                                alt=""
                              />
                              <input
                                type="file"
                                className="form-control image-sign"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setUploadingImage(true);
                                    const res = await uploadDoctorImage(file);
                                    setProfileImage(res.path);
                                  } catch (err: any) {
                                    const msg = err?.response?.data?.message || err?.message || "Unknown error";
                                    setError(`Failed to upload image: ${msg}`);
                                    // eslint-disable-next-line no-alert
                                    alert(`Failed to upload image: ${msg}`);
                                  } finally {
                                    setUploadingImage(false);
                                  }
                                }}
                              />
                              {uploadingImage && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.35)" }}>
                                  <span className="text-white fw-semibold small">Uploading...</span>
                                </div>
                              )}
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
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  New Password
                                </label>
                                <input
                                  type="password"
                                  className="form-control"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  minLength={6}
                                  placeholder="Leave blank to keep current password"
                                />
                                <small className="text-muted">Enter new password only if you want to change it (minimum 6 characters)</small>
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
                      <h6 className="fw-bold mb-0">Schedule Information</h6>
                    </div>
                    <div className="pb-0 mb-3">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                              type="text"
                              className="form-control"
                              value={scheduleLocation}
                              onChange={(e) => setScheduleLocation(e.target.value)}
                              placeholder="e.g., Main Clinic, Branch Office"
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Recurs Every</label>
                            <CommonSelect
                              options={[
                                { value: "1 Week", label: "1 Week" },
                                { value: "2 Weeks", label: "2 Weeks" },
                                { value: "1 Month", label: "1 Month" },
                                { value: "3 Months", label: "3 Months" },
                                { value: "6 Months", label: "6 Months" },
                                { value: "1 Year", label: "1 Year" },
                              ]}
                              className="select"
                              value={scheduleRecursEvery}
                              onChange={setScheduleRecursEvery}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Schedule Start Date</label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{ format: "DD-MM-YYYY", type: "mask" }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                                value={scheduleFromDate}
                                onChange={setScheduleFromDate}
                              />
                              <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Schedule End Date</label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{ format: "DD-MM-YYYY", type: "mask" }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                                value={scheduleToDate}
                                onChange={setScheduleToDate}
                              />
                              <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <ul className="nav nav-pills schedule-tab mb-3" id="pills-tab2" role="tablist">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                          <li key={day} className="nav-item me-1" role="presentation">
                            <button
                              className={`nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto ${index === 0 ? "active" : ""}`}
                              data-bs-toggle="pill"
                              data-bs-target={`#edit-schedule-${index + 1}`}
                              type="button"
                              role="tab"
                              aria-selected={index === 0}
                              tabIndex={index === 0 ? undefined : -1}
                            >
                              {day}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="tab-content" id="pills-tabContent2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                          <div
                            key={day}
                            className={`tab-pane fade ${index === 0 ? "active show" : ""}`}
                            id={`edit-schedule-${index + 1}`}
                            role="tabpanel"
                          >
                            <div className="add-schedule-list">
                              <EditScheduleForm
                                day={day}
                                rows={schedulesByDay[day] || []}
                                onChange={(rows) => handleScheduleChange(day, rows)}
                              />
                            </div>
                          </div>
                        ))}
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

// Controlled schedule form for edit: session + from/to time per row
const EditScheduleForm: React.FC<{
  day: string;
  rows: ScheduleRow[];
  onChange: (rows: ScheduleRow[]) => void;
}> = ({ day: _day, rows, onChange }) => {
  const createRow = (): ScheduleRow => ({
    id: Date.now() + Math.random(),
    session: Session[0]?.value || "",
    from: dayjs("00:00:00", "HH:mm:ss"),
    to: dayjs("00:00:00", "HH:mm:ss"),
  });

  const handleAddRow = (row: ScheduleRow) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, createRow());
    onChange(newRows);
  };

  const handleDeleteRow = (id: number) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const handleTimeChange = (id: number, field: "from" | "to", time: Dayjs | null) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: time } : r)));
  };

  const handleSessionChange = (id: number, session: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, session } : r)));
  };

  useEffect(() => {
    if (rows.length === 0) {
      onChange([createRow()]);
    }
  }, []);

  return (
    <div>
      {rows.map((row) => (
        <div className="row gx-3" key={row.id}>
          <div className="col-lg-5">
            <div className="mb-3">
              <label className="form-label">Session</label>
              <CommonSelect
                options={Session}
                className="select"
                value={row.session}
                onChange={(value) => handleSessionChange(row.id, value)}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="row align-items-end gx-3">
              <div className="col-lg-9">
                <div className="row gx-3">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">From</label>
                      <div className="input-icon-end position-relative">
                        <TimePicker
                          className="form-control"
                          value={row.from}
                          onChange={(time: Dayjs | null) => handleTimeChange(row.id, "from", time)}
                          defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                          format="HH:mm"
                        />
                        <span className="input-icon-addon"><i className="ti ti-clock-hour-10" /></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">To</label>
                      <div className="input-icon-end position-relative">
                        <TimePicker
                          className="form-control"
                          value={row.to}
                          onChange={(time: Dayjs | null) => handleTimeChange(row.id, "to", time)}
                          defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                          format="HH:mm"
                        />
                        <span className="input-icon-addon"><i className="ti ti-clock-hour-10" /></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3 d-flex">
                  <Link to="#" onClick={(e) => { e.preventDefault(); handleAddRow(row); }} className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center" style={{ marginRight: 8 }}>
                    <i className="ti ti-plus fs-16" />
                  </Link>
                  {rows.length > 1 && (
                    <Link to="#" onClick={(e) => { e.preventDefault(); handleDeleteRow(row.id); }} className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center">
                      <i className="ti ti-trash fs-16" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditDoctor;
