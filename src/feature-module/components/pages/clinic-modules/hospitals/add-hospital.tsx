import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import {
  createHospital,
  updateHospital,
  fetchHospitalById,
  type HospitalRequest,
} from "../../../../../api/hospitals";
import { useAuth } from "../../../../../core/context/AuthContext";

const AddHospital = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  // Only super_admin can access this page
  useEffect(() => {
    if (user?.role !== "super_admin") {
      navigate(all_routes.dashboard);
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState<HospitalRequest>({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    status: "Active",
    hospitalAdminEmail: "",
    hospitalAdminName: "",
    hospitalAdminPassword: "",
    hospitalAdminPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [assignAdmin, setAssignAdmin] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchHospitalById(id)
        .then((data) => {
          const admin = typeof data.hospitalAdmin === "object" ? data.hospitalAdmin : null;
          setFormData({
            name: data.name || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            phone: data.phone || "",
            email: data.email || "",
            status: data.status || "Active",
            hospitalAdminEmail: admin?.email || "",
            hospitalAdminName: admin?.name || "",
            hospitalAdminPassword: "",
            hospitalAdminPhone: admin?.phone || "",
          });
          setAssignAdmin(!!admin);
        })
        .catch((err) => {
          alert(`Failed to load hospital: ${err?.response?.data?.message || err?.message}`);
          navigate(all_routes.hospitals);
        })
        .finally(() => setLoadingData(false));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: HospitalRequest = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
      };

      // Only include admin data if assignAdmin is true
      if (assignAdmin) {
        if (!formData.hospitalAdminEmail || !formData.hospitalAdminName) {
          alert("Hospital admin email and name are required when assigning an admin");
          setLoading(false);
          return;
        }
        if (!isEdit && !formData.hospitalAdminPassword) {
          alert("Hospital admin password is required when creating a new admin");
          setLoading(false);
          return;
        }
        submitData.hospitalAdminEmail = formData.hospitalAdminEmail;
        submitData.hospitalAdminName = formData.hospitalAdminName;
        submitData.hospitalAdminPhone = formData.hospitalAdminPhone;
        if (formData.hospitalAdminPassword) {
          submitData.hospitalAdminPassword = formData.hospitalAdminPassword;
        }
      }

      if (isEdit && id) {
        await updateHospital(id, submitData);
      } else {
        await createHospital(submitData);
      }
      navigate(all_routes.hospitals);
    } catch (err: any) {
      alert(`Failed to ${isEdit ? "update" : "create"} hospital: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center p-5">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-semibold mb-0">{isEdit ? "Edit" : "Add"} Hospital</h4>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Hospital Information */}
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Hospital Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Hospital Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Status <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Address <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        City <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        State <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Admin Assignment */}
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="assignAdmin"
                      checked={assignAdmin}
                      onChange={(e) => setAssignAdmin(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="assignAdmin">
                      <h5 className="mb-0">Assign Hospital Admin</h5>
                    </label>
                  </div>
                </div>
                {assignAdmin && (
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          Admin Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          required={assignAdmin}
                          value={formData.hospitalAdminName}
                          onChange={(e) => setFormData({ ...formData, hospitalAdminName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          Admin Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          required={assignAdmin}
                          value={formData.hospitalAdminEmail}
                          onChange={(e) => setFormData({ ...formData, hospitalAdminEmail: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          Admin Phone
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.hospitalAdminPhone}
                          onChange={(e) => setFormData({ ...formData, hospitalAdminPhone: e.target.value })}
                        />
                      </div>
                      {!isEdit && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Admin Password <span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            required={assignAdmin && !isEdit}
                            value={formData.hospitalAdminPassword}
                            onChange={(e) => setFormData({ ...formData, hospitalAdminPassword: e.target.value })}
                            placeholder={isEdit ? "Leave blank to keep current password" : ""}
                          />
                          {isEdit && (
                            <small className="text-muted">Leave blank to keep current password</small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(all_routes.hospitals)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Hospital" : "Create Hospital"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHospital;
