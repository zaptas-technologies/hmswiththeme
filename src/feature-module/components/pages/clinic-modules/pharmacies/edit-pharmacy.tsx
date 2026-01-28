import { Link, useNavigate, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { fetchPharmacyById, updatePharmacy, type PharmacyRequest } from "../../../../../api/pharmacies";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const EditPharmacy = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [formData, setFormData] = useState<PharmacyRequest>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      loadPharmacyData();
    }
  }, [id]);

  const loadPharmacyData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const pharmacy = await fetchPharmacyById(id);
      setFormData({
        name: pharmacy.name,
        email: pharmacy.email,
        phone: pharmacy.phone || "",
        password: "", // Don't load password
      });
    } catch (error: any) {
      console.error("Failed to load pharmacy:", error);
      alert(`Failed to load pharmacy user: ${error.response?.data?.message || error.message || "Unknown error"}`);
      navigate(all_routes.pharmacies);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const updateData: Partial<PharmacyRequest> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      await updatePharmacy(id!, updateData);
      alert("Pharmacy user updated successfully!");
      navigate(all_routes.pharmacies);
    } catch (error: any) {
      console.error("Failed to update pharmacy:", error);
      alert(`Failed to update pharmacy user: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading pharmacy user...</p>
          </div>
        </div>
      </div>
    );
  }

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
                      Edit Pharmacy User
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
                          New Password <span className="text-muted">(leave blank to keep current)</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Enter new password (optional)"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
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
                            Updating...
                          </>
                        ) : (
                          "Update Pharmacy User"
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

export default EditPharmacy;
