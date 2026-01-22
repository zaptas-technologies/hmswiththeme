import { DatePicker, TimePicker } from "antd";
import { Link, useNavigate } from "react-router";
import dayjs, { Dayjs } from "dayjs";
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
import { all_routes } from "../../../../routes/all_routes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { createDoctor } from "../../../../../api/doctors";
import type { Doctor, DaySchedule, TimeSlot, Education, Award } from "../../../../../api/doctors";
import { fetchLocations } from "../../../../../api/locations";
import type { Option } from "../../../../../core/common/common-select/commonSelect";

interface ScheduleRow {
  id: number;
  session: string;
  from: Dayjs | null;
  to: Dayjs | null;
}

interface EducationRow {
  id: number;
  degree: string;
  university: string;
  from: Dayjs | null;
  to: Dayjs | null;
}

interface AwardRow {
  id: number;
  name: string;
  from: Dayjs | null;
}

const AddDoctor = () => {
  const navigate = useNavigate();
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  // Basic Info
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [yearOfExperience, setYearOfExperience] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [tags, setTags] = useState<string[]>(["English", "French"]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("About Doctor");
  const [featureOnWebsite, setFeatureOnWebsite] = useState(false);
  const [, setProfileImage] = useState<File | null>(null);

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Schedule (per day)
  const [schedules, setSchedules] = useState<Record<string, ScheduleRow[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  // Appointment Info
  const [appointmentType, setAppointmentType] = useState("");
  const [acceptBookingsInAdvance, setAcceptBookingsInAdvance] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("");
  const [consultationCharge, setConsultationCharge] = useState("");
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState("");
  const [displayOnBookingPage, setDisplayOnBookingPage] = useState(false);

  // Education, Awards, Certifications
  const [education, setEducation] = useState<EducationRow[]>([{ id: Date.now(), degree: "", university: "", from: null, to: null }]);
  const [awards, setAwards] = useState<AwardRow[]>([{ id: Date.now(), name: "", from: null }]);
  const [certifications, setCertifications] = useState<AwardRow[]>([{ id: Date.now(), name: "", from: null }]);

  // Dynamic Options
  const [locations] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load locations if needed in future
    // loadLocations();
  }, []);

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const handleScheduleChange = (day: string, rows: ScheduleRow[]) => {
    setSchedules(prev => ({ ...prev, [day]: rows }));
  };

  const handleEducationChange = (rows: EducationRow[]) => {
    setEducation(rows);
  };

  const handleAwardsChange = (rows: AwardRow[]) => {
    setAwards(rows);
  };

  const handleCertificationsChange = (rows: AwardRow[]) => {
    setCertifications(rows);
  };

  const convertScheduleToAPIFormat = (): DaySchedule[] => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days
      .map(day => {
        const daySchedules = schedules[day] || [];
        if (daySchedules.length === 0) return null;

        const timeSlots: TimeSlot[] = daySchedules
          .filter(row => row.from && row.to)
          .map(row => ({
            session: row.session || Session[0]?.value || "",
            from: row.from ? row.from.format("HH:mm") : "",
            to: row.to ? row.to.format("HH:mm") : "",
          }));

        if (timeSlots.length === 0) return null;

        return {
          day: day as DaySchedule["day"],
          timeSlots,
        };
      })
      .filter((schedule): schedule is DaySchedule => schedule !== null);
  };

  const convertEducationToAPIFormat = (): Education[] => {
    return education
      .filter(edu => edu.degree && edu.university && edu.from && edu.to)
      .map(edu => ({
        degree: edu.degree,
        university: edu.university,
        from: edu.from ? edu.from.format("YYYY-MM-DD") : "",
        to: edu.to ? edu.to.format("YYYY-MM-DD") : "",
      }));
  };

  const convertAwardsToAPIFormat = (): Award[] => {
    return awards
      .filter(award => award.name && award.from)
      .map(award => ({
        name: award.name,
        from: award.from ? award.from.format("YYYY-MM-DD") : "",
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone) {
      alert("Please fill in required fields: Name, Email, and Phone");
      return;
    }

    setSubmitting(true);
    try {
      const doctorData: Partial<Doctor> = {
        id: Date.now().toString(),
        Name_Designation: `${name}${designation ? ` - ${designation}` : ""}`,
        Email: email,
        Phone: phone,
        Department: department,
        role: designation,
        Fees: consultationCharge,
        Status: "Available",
        
        // Extended fields
        username,
        dob: dob ? dob.format("YYYY-MM-DD") : undefined,
        yearOfExperience,
        medicalLicenseNumber,
        languageSpoken: tags,
        bio,
        featureOnWebsite,
        bloodGroup,
        gender,
        
        // Address
        address1,
        address2,
        country,
        state,
        city,
        pincode,
        
        // Schedule
        schedules: convertScheduleToAPIFormat(),
        
        // Appointment info
        appointmentType,
        acceptBookingsInAdvance,
        appointmentDuration,
        consultationCharge,
        maxBookingsPerSlot,
        displayOnBookingPage,
        
        // Education, Awards, Certifications
        education: convertEducationToAPIFormat(),
        awards: convertAwardsToAPIFormat(),
        certifications: convertAwardsToAPIFormat(),
      };

      await createDoctor(doctorData);
      alert("Doctor added successfully!");
      navigate(all_routes.doctors);
    } catch (error: any) {
      console.error("Failed to create doctor:", error);
      alert(`Failed to create doctor: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

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
              {/* Start Add Doctor */}
              <div className="card">
                {/* <div class="card-header">
                          
                      </div> */}
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold">
                      New Doctord
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
                              <i className="ti ti-user-plus fs-16" />
                              <input
                                type="file"
                                className="form-control image-sign"
                                accept="image/*"
                                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
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
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Username
                                  <span className="text-danger">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
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
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Email Address
                                  <span className="text-danger">*</span>
                                </label>
                                <input 
                                  type="email" 
                                  className="form-control" 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  required
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
                                    value={dob}
                                    onChange={setDob}
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
                                  value={yearOfExperience}
                                  onChange={(e) => setYearOfExperience(e.target.value)}
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
                                  value={department}
                                  onChange={setDepartment}
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
                                  value={designation}
                                  onChange={setDesignation}
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
                                  value={medicalLicenseNumber}
                                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Language Spoken
                                </label>
                                <TagInput
                                  initialTags={tags}
                                  onTagsChange={handleTagsChange}
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
                                  value={bloodGroup}
                                  onChange={setBloodGroup}
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
                                  value={gender}
                                  onChange={setGender}
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
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                            />
                          </div>
                          <div className="form-check form-switch mb-3">
                            <label
                              className="form-check-label"
                              htmlFor="switchCheckDefault"
                            >
                              Feature On Website
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="switchCheckDefault"
                              checked={featureOnWebsite}
                              onChange={(e) => setFeatureOnWebsite(e.target.checked)}
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
                              value={address1}
                              onChange={(e) => setAddress1(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Address 2 </label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={address2}
                              onChange={(e) => setAddress2(e.target.value)}
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
                              value={country}
                              onChange={setCountry}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">City</label>
                            <CommonSelect
                              options={City}
                              className="select"
                              value={city}
                              onChange={setCity}
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
                              value={state}
                              onChange={setState}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Pincode</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Schedule Information</h6>
                    </div>
                    <div className="p-3">
                      <ul
                        className="nav nav-pills schedule-tab mb-3"
                        id="pills-tab"
                        role="tablist"
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                          <li key={day} className="nav-item me-1" role="presentation">
                            <button
                              className={`nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto ${index === 0 ? "active" : ""}`}
                              data-bs-toggle="pill"
                              data-bs-target={`#schedule-${index + 1}`}
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
                      <div className="tab-content" id="pills-tabContent">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                          <div
                            key={day}
                            className={`tab-pane fade ${index === 0 ? "active show" : ""}`}
                            id={`schedule-${index + 1}`}
                            role="tabpanel"
                          >
                            <div className="add-schedule-list">
                              <ScheduleForm 
                                day={day}
                                rows={schedules[day] || []}
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
                              value={appointmentType}
                              onChange={setAppointmentType}
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
                                type="text" 
                                className="form-control" 
                                value={acceptBookingsInAdvance}
                                onChange={(e) => setAcceptBookingsInAdvance(e.target.value)}
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
                                type="text" 
                                className="form-control" 
                                value={appointmentDuration}
                                onChange={(e) => setAppointmentDuration(e.target.value)}
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
                                value={consultationCharge}
                                onChange={(e) => setConsultationCharge(e.target.value)}
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
                              type="text" 
                              className="form-control" 
                              value={maxBookingsPerSlot}
                              onChange={(e) => setMaxBookingsPerSlot(e.target.value)}
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
                              checked={displayOnBookingPage}
                              onChange={(e) => setDisplayOnBookingPage(e.target.checked)}
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
                        <EducationForm 
                          rows={education}
                          onChange={handleEducationChange}
                        />
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Awards &amp; Recognition</h6>
                    </div>
                    <div className="pb-0">
                      <div className="add-award-list">
                        <AwardForm 
                          rows={awards}
                          onChange={handleAwardsChange}
                        />
                      </div>
                    </div>
                    <div className="bg-light px-3 py-2">
                      <h6 className="fw-bold mb-0">Certifications</h6>
                    </div>
                    <div className="pb-3 mb-3 border-bottom">
                      <div className="add-certification-list">
                        <AwardForm 
                          rows={certifications}
                          onChange={handleCertificationsChange}
                        />
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
                        disabled={submitting}
                      >
                        {submitting ? "Adding..." : "Add Doctor"}
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

// Controlled Schedule Form Component
const ScheduleForm: React.FC<{
  day: string;
  rows: ScheduleRow[];
  onChange: (rows: ScheduleRow[]) => void;
}> = ({ rows, onChange }) => {
  // day parameter kept for future use (e.g., day-specific validation)
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
    onChange(rows.filter((row) => row.id !== id));
  };

  const handleTimeChange = (id: number, field: "from" | "to", time: Dayjs | null) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: time } : row)));
  };

  const handleSessionChange = (id: number, session: string) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, session } : row)));
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
                        <span className="input-icon-addon">
                          <i className="ti ti-clock-hour-10" />
                        </span>
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
                        <span className="input-icon-addon">
                          <i className="ti ti-clock-hour-10" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3 d-flex">
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddRow(row);
                    }}
                    className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                    style={{ marginRight: 8 }}
                  >
                    <i className="ti ti-plus fs-16" />
                  </Link>
                  {rows.length > 1 && (
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteRow(row.id);
                      }}
                      className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center"
                    >
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

// Controlled Education Form Component
const EducationForm: React.FC<{
  rows: EducationRow[];
  onChange: (rows: EducationRow[]) => void;
}> = ({ rows, onChange }) => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const createRow = (): EducationRow => ({
    id: Date.now() + Math.random(),
    degree: "",
    university: "",
    from: null,
    to: null,
  });

  const handleAddRow = (row: EducationRow) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, createRow());
    onChange(newRows);
  };

  const handleDeleteRow = (id: number) => {
    onChange(rows.filter((row) => row.id !== id));
  };

  const handleFieldChange = (id: number, field: keyof EducationRow, value: any) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  useEffect(() => {
    if (rows.length === 0) {
      onChange([createRow()]);
    }
  }, []);

  return (
    <div>
      {rows.map((row) => (
        <div className="row align-items-end" key={row.id}>
          <div className="col-lg-11">
            <div className="row">
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">Educational Degree</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.degree}
                    onChange={(e) => handleFieldChange(row.id, "degree", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">University</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.university}
                    onChange={(e) => handleFieldChange(row.id, "university", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">From</label>
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
                      value={row.from}
                      onChange={(date) => handleFieldChange(row.id, "from", date)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">To</label>
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
                      value={row.to}
                      onChange={(date) => handleFieldChange(row.id, "to", date)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-1">
            <div className="mb-3 d-flex">
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddRow(row);
                }}
                className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                style={{ marginRight: 8 }}
              >
                <i className="ti ti-plus fs-16" />
              </Link>
              {rows.length > 1 && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteRow(row.id);
                  }}
                  className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Controlled Award Form Component
const AwardForm: React.FC<{
  rows: AwardRow[];
  onChange: (rows: AwardRow[]) => void;
}> = ({ rows, onChange }) => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const createRow = (): AwardRow => ({
    id: Date.now() + Math.random(),
    name: "",
    from: null,
  });

  const handleAddRow = (row: AwardRow) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, createRow());
    onChange(newRows);
  };

  const handleDeleteRow = (id: number) => {
    onChange(rows.filter((row) => row.id !== id));
  };

  const handleFieldChange = (id: number, field: keyof AwardRow, value: any) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  useEffect(() => {
    if (rows.length === 0) {
      onChange([createRow()]);
    }
  }, []);

  return (
    <div>
      {rows.map((row) => (
        <div className="row align-items-end" key={row.id}>
          <div className="col-lg-11">
            <div className="row">
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.name}
                    onChange={(e) => handleFieldChange(row.id, "name", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label">From</label>
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
                      value={row.from}
                      onChange={(date) => handleFieldChange(row.id, "from", date)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-1">
            <div className="mb-3 d-flex">
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddRow(row);
                }}
                className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                style={{ marginRight: 8 }}
              >
                <i className="ti ti-plus fs-16" />
              </Link>
              {rows.length > 1 && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteRow(row.id);
                  }}
                  className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddDoctor;
