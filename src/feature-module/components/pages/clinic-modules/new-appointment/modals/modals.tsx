import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Blood_Group,
  City,
  Country,
  Gender,
  Primary_Doctor,
  State,
  Status,
} from "../../../../../../core/common/selectOption";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import { DatePicker } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { createPatient } from "../../../../../../api/patients";
import { fetchDoctors, type Doctor } from "../../../../../../api/doctors";
import type { Option } from "../../../../../../core/common/common-select/commonSelect";

interface ModalsProps {
  onPatientCreated?: () => void;
  prefillPhone?: string | null;
  onAddModalClosed?: () => void;
}

const Modals = ({ onPatientCreated, prefillPhone, onAddModalClosed }: ModalsProps) => {
  const [phone, setPhone] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    PrimaryDoctor: "",
    DOB: null as Dayjs | null,
    Gender: "",
    BloodGroup: "",
    Status: "Available" as "Available" | "Unavailable",
    Address1: "",
    Address2: "",
    Country: "",
    State: "",
    City: "",
    Pincode: "",
  });

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsRes = await fetchDoctors({ limit: 100, sort: "Name_Designation" });
        const doctorsList = Array.isArray(doctorsRes) ? doctorsRes : doctorsRes.data || [];
        setDoctors(doctorsList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load doctors:", error);
      }
    };
    loadDoctors();
  }, []);

  // Prefill phone when opened from "new patient?" flow (search by phone found no match)
  useEffect(() => {
    if (prefillPhone) {
      setPhone(prefillPhone);
      setFormData((prev) => ({ ...prev, Phone: prefillPhone }));
    }
  }, [prefillPhone]);

  // Notify parent when add modal is closed so they can clear prefill
  useEffect(() => {
    const el = document.getElementById("add_modal");
    if (!el || !onAddModalClosed) return;
    const onHidden = () => onAddModalClosed();
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, [onAddModalClosed]);

  const doctorOptions: Option[] = doctors.map((doc) => ({
    value: doc.Name_Designation || doc.Doctor || "",
    label: doc.Name_Designation || doc.Doctor || "",
  }));

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.FirstName ||
      !formData.LastName ||
      !phone ||
      !formData.Email ||
      !formData.Gender ||
      !formData.Status
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const patientName = `${formData.FirstName} ${formData.LastName}`.trim();
      const fullAddress = [formData.Address1, formData.Address2, formData.City, formData.State, formData.Country]
        .filter(Boolean)
        .join(", ");

      await createPatient({
        Patient: patientName,
        Phone: phone,
        Email: formData.Email,
        Gender: formData.Gender,
        Blood_Group: formData.BloodGroup || undefined,
        DOB: formData.DOB ? formData.DOB.format("DD-MM-YYYY") : undefined,
        Doctor: formData.PrimaryDoctor || undefined,
        Address: fullAddress || undefined,
        Status: formData.Status,
        // Additional fields
        Country: formData.Country || undefined,
        State: formData.State || undefined,
        City: formData.City || undefined,
        Pincode: formData.Pincode || undefined,
      });

      // Close modal
      const modal = document.getElementById("add_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }

      // Reset form
      setFormData({
        FirstName: "",
        LastName: "",
        Phone: "",
        Email: "",
        PrimaryDoctor: "",
        DOB: null,
        Gender: "",
        BloodGroup: "",
        Status: "Available",
        Address1: "",
        Address2: "",
        Country: "",
        State: "",
        City: "",
        Pincode: "",
      });
      setPhone(undefined);

      onPatientCreated?.();
      alert("Patient created successfully!");
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Error creating patient:", error);
      alert(
        `Failed to create patient: ${
          error?.response?.data?.message || error?.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Start Add modal */}
      <div className="modal fade" id="add_modal">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Add New Patient</h5>
              <button
                type="button"
                className="btn-close custom-btn-close opacity-100"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x bg-white fs-16 text-dark" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                {/* form start */}
                <div className="form">
                <h6 className="fw-bold mb-3">Patient Information</h6>
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3 d-flex align-items-center">
                      <label className="form-label mb-0">Profile Image</label>
                      <div className="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                        <i className="ti ti-user-plus fs-16" />
                        <input
                          type="file"
                          className="form-control image-sign"
                          multiple
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
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        First Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.FirstName}
                        onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Last Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.LastName}
                        onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium custom-phoneinput">
                        Phone Number<span className="text-danger ms-1">*</span>
                      </label>
                      <PhoneInput
                        defaultCountry="US"
                        value={phone}
                        onChange={(value) => {
                          setPhone(value);
                          setFormData({ ...formData, Phone: value || "" });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Email Address<span className="text-danger ms-1">*</span>
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
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Primary Doctor
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={doctorOptions.length > 0 ? doctorOptions : Primary_Doctor}
                        className="select"
                        value={formData.PrimaryDoctor}
                        onChange={(value) => setFormData({ ...formData, PrimaryDoctor: value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        DOB<span className="text-danger ms-1">*</span>
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
                          value={formData.DOB}
                          onChange={(date) => setFormData({ ...formData, DOB: date })}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Gender<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={Gender}
                        className="select"
                        value={formData.Gender}
                        onChange={(value) => setFormData({ ...formData, Gender: value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Blood Group</label>
                      <CommonSelect
                        options={Blood_Group}
                        className="select"
                        value={formData.BloodGroup}
                        onChange={(value) => setFormData({ ...formData, BloodGroup: value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Status<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={Status}
                        className="select"
                        value={formData.Status}
                        onChange={(value) =>
                          setFormData({ ...formData, Status: value as "Available" | "Unavailable" })
                        }
                      />
                    </div>
                  </div>
                </div>
                <h6 className="fw-bold mb-3 border-top pt-3">
                  Address Information
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Address 1<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.Address1}
                        onChange={(e) => setFormData({ ...formData, Address1: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">Address 2</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.Address2}
                        onChange={(e) => setFormData({ ...formData, Address2: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Country<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={Country}
                        className="select"
                        value={formData.Country}
                        onChange={(value) => setFormData({ ...formData, Country: value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">State</label>
                      <CommonSelect
                        options={State}
                        className="select"
                        value={formData.State}
                        onChange={(value) => setFormData({ ...formData, State: value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">City</label>
                      <CommonSelect
                        options={City}
                        className="select"
                        value={formData.City}
                        onChange={(value) => setFormData({ ...formData, City: value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">Pincode</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.Pincode}
                        onChange={(e) => setFormData({ ...formData, Pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* form end */}
              </div>
              </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light btn-sm me-2 fs-13 fw-medium"
                data-bs-dismiss="modal"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm fs-13 fw-medium"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add New Patient"}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
      {/* End Add modal  */}
    </>
  );
};

export default Modals;
