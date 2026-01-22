import { Link } from "react-router";
import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { createLocation, updateLocation, type Location } from "../../../../../../api/locations";

interface ModalsProps {
  selectedLocation?: Location | null;
  onLocationSaved?: () => void;
  onDelete?: () => void;
}

const Modals = ({ selectedLocation = null, onLocationSaved, onDelete }: ModalsProps = {}) => {
  const [formData, setFormData] = useState({
    Location: "",
    Address: "",
    Phone: "",
    Email: "",
    Status: "Active" as "Active" | "Inactive",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLocation) {
      setFormData({
        Location: selectedLocation.Location || selectedLocation.Clinic_Name || "",
        Address: selectedLocation.Address || "",
        Phone: selectedLocation.Phone || "",
        Email: selectedLocation.Email || "",
        Status: (selectedLocation.Status as "Active" | "Inactive") || "Active",
      });
    } else {
      setFormData({
        Location: "",
        Address: "",
        Phone: "",
        Email: "",
        Status: "Active",
      });
    }
  }, [selectedLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createLocation({
        ...formData,
        id: Date.now().toString(), // Generate temporary ID
      });
      // Close modal
      const modal = document.getElementById("add_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      // Reset form
      setFormData({
        Location: "",
        Address: "",
        Phone: "",
        Email: "",
        Status: "Active",
      });
      onLocationSaved?.();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create location";
      alert(errorMessage);
      console.error("Error creating location:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    try {
      setLoading(true);
      const locationId = selectedLocation.id || selectedLocation._id;
      if (!locationId) {
        alert("Location ID not found");
        return;
      }
      // Don't send id or _id in update payload - backend will preserve it
      const { id, _id, ...updateData } = formData as any;
      await updateLocation(locationId, updateData);
      // Close modal
      const modal = document.getElementById("edit_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      onLocationSaved?.();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to update location";
      alert(errorMessage);
      console.error("Error updating location:", err);
      console.error("Location ID:", selectedLocation.id || selectedLocation._id);
      console.error("Update data:", formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
      // Close modal
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    }
  };
  return (
    <>
      {/* Start Add modal */}
      <div className="modal fade" id="add_modal">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <form onSubmit={handleAddSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark fw-bold">New Location</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close opacity-100"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x bg-white fs-16 text-dark" />
                </button>
              </div>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Location Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="Location"
                        className="form-control"
                        value={formData.Location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Address<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="Address"
                        className="form-control"
                        value={formData.Address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="Phone"
                        className="form-control"
                        value={formData.Phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="Email"
                        className="form-control"
                        value={formData.Email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Status<span className="text-danger ms-1">*</span>
                      </label>
                      <select
                        name="Status"
                        className="form-control"
                        value={formData.Status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
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
                  {loading ? "Adding..." : "Add New Location"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* End Add modal  */}
      {/* Start edit modal */}
      <div className="modal fade" id="edit_modal">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <form onSubmit={handleEditSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark fw-bold">Edit Location</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close opacity-100"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x bg-white fs-16 text-dark" />
                </button>
              </div>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Location Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="Location"
                        className="form-control"
                        value={formData.Location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Address<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="Address"
                        className="form-control"
                        value={formData.Address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="Phone"
                        className="form-control"
                        value={formData.Phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="Email"
                        className="form-control"
                        value={formData.Email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Status<span className="text-danger ms-1">*</span>
                      </label>
                      <select
                        name="Status"
                        className="form-control"
                        value={formData.Status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
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
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* End edit modal  */}
      {/* Start Delete Modal  */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-0"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-0"
              />
              <div className="mb-3 position-relative z-1">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1 position-relative z-1">
                Delete Confirmation
              </h5>
              <p className="mb-3 position-relative z-1">
                Are you sure want to delete?
              </p>
              <div className="d-flex justify-content-center">
                <Link
                  to="#"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Delete Modal  */}
    </>
  );
};

export default Modals;
