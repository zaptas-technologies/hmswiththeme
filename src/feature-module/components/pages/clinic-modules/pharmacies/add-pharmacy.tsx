import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import { createPharmacy, type PharmacyRequest } from "../../../../../api/pharmacies";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const AddPharmacy = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PharmacyRequest>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await createPharmacy(formData);
      alert("Pharmacy user added successfully!");
      navigate(all_routes.pharmacies);
    } catch (error: any) {
      console.error("Failed to create pharmacy:", error);
      alert(`Failed to create pharmacy user: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.pharmacies}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Pharmacy Users
                    </Link>
                  </h6>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold">
                      Add Pharmacy User
                    </h5>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Phone
                        </label>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={formData.phone}
                          onChange={(value) =>
                            setFormData({ ...formData, phone: value || "" })
                          }
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Password <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i
                              className={`ti ti-${
                                showPassword ? "eye-off" : "eye"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-end gap-2 mt-4">
                      <Link
                        to={all_routes.pharmacies}
                        className="btn btn-light"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            />
                            Adding...
                          </>
                        ) : (
                          "Add Pharmacy User"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2026©
            <Link to="#" className="link-primary">
              Zaptas
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default AddPharmacy;
