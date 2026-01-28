import { Link, useNavigate } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { fetchPharmacies, deletePharmacy, impersonatePharmacy, type Pharmacy } from "../../../../../api/pharmacies";

const Pharmacies = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPharmacies, setTotalPharmacies] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const limit = 15;

  useEffect(() => {
    loadPharmacies(1);
  }, []);

  const loadPharmacies = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetchPharmacies({
        page: pageNum,
        limit,
        sort: "-createdAt",
      });

      let pharmaciesData: Pharmacy[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        pharmaciesData = response;
        total = response.length;
      } else {
        const paginatedResponse = response as any;
        pharmaciesData = paginatedResponse.data || [];
        total = paginatedResponse.pagination?.total || paginatedResponse.total || pharmaciesData.length;
      }

      if (append) {
        setPharmacies((prev) => [...prev, ...pharmaciesData]);
      } else {
        setPharmacies(pharmaciesData);
        setTotalPharmacies(total);
      }

      setHasMore(pharmaciesData.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load pharmacies:", error);
      alert("Failed to load pharmacies. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPharmacies(page + 1, true);
    }
  };

  const handleDelete = async () => {
    if (!selectedPharmacy) return;

    try {
      const pharmacyId = selectedPharmacy._id || selectedPharmacy.id;
      if (!pharmacyId) {
        alert("Pharmacy ID not found");
        return;
      }

      await deletePharmacy(pharmacyId);
      alert("Pharmacy user deleted successfully");
      
      setPharmacies((prev) => prev.filter((p) => (p._id || p.id) !== pharmacyId));
      setTotalPharmacies((prev) => prev - 1);
      setSelectedPharmacy(null);
      
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      }
    } catch (error: any) {
      console.error("Failed to delete pharmacy:", error);
      alert(`Failed to delete pharmacy: ${error.response?.data?.message || error.message || "Unknown error"}`);
    }
  };

  const handleEditClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    navigate(`${all_routes.editPharmacy}?id=${pharmacy._id || pharmacy.id}`);
  };

  const handleDeleteClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };

  const handleImpersonate = async (pharmacy: Pharmacy) => {
    try {
      const pharmacyId = pharmacy._id || pharmacy.id;
      if (!pharmacyId) {
        alert("Pharmacy ID not found");
        return;
      }

      const response = await impersonatePharmacy(pharmacyId);
      
      // Store the token and user directly
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      // Reload the page to update auth context
      window.location.href = all_routes.dashboard;
    } catch (error: any) {
      console.error("Failed to impersonate pharmacy:", error);
      alert(`Failed to login as pharmacy user: ${error.response?.data?.message || error.message || "Unknown error"}`);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Pharmacy Users
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "..." : totalPharmacies}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <Link
                to={all_routes.addPharmacy}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Pharmacy User
              </Link>
            </div>
          </div>

          {loading && pharmacies.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading pharmacies...</p>
            </div>
          ) : pharmacies.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No pharmacy users found.</p>
              <Link to={all_routes.addPharmacy} className="btn btn-primary mt-3">
                Add First Pharmacy User
              </Link>
            </div>
          ) : (
            <div className="row">
              {pharmacies.map((pharmacy, index) => {
                const pharmacyId = pharmacy._id || pharmacy.id || "";
                const pharmacyName = pharmacy.name || "Unknown";
                
                return (
                  <div key={pharmacyId || index} className="col-xl-4 col-md-6 mb-3">
                    <div className="card">
                      <div className="card-body d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3">
                        <div className="me-3">
                          <div className="avatar avatar-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                            <span className="fs-18 fw-semibold">
                              {pharmacyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-fill">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <h6 className="mb-0 fw-semibold">
                              {pharmacyName}
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
                                      handleImpersonate(pharmacy);
                                    }}
                                  >
                                    <i className="ti ti-login me-2" />
                                    Login As
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item d-flex align-items-center"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEditClick(pharmacy);
                                    }}
                                  >
                                    <i className="ti ti-edit me-2" />
                                    Edit
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item d-flex align-items-center text-danger"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteClick(pharmacy);
                                      const modal = document.getElementById("delete_modal");
                                      if (modal) {
                                        const bsModal = new (window as any).bootstrap.Modal(modal);
                                        bsModal.show();
                                      }
                                    }}
                                  >
                                    <i className="ti ti-trash me-2" />
                                    Delete
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <span className="d-block mb-2 fs-13 text-muted">
                            <i className="ti ti-mail me-1" />
                            {pharmacy.email}
                          </span>
                          {pharmacy.phone && (
                            <p className="mb-2 fs-13 text-muted">
                              <i className="ti ti-phone me-1" />
                              {pharmacy.phone}
                            </p>
                          )}
                          <div className="d-flex align-items-center">
                            <span className="badge bg-success-subtle text-success fs-12">
                              Pharmacist
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pharmacies.length > 0 && (
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
                <p className="text-muted">No more pharmacies to load</p>
              )}
            </div>
          )}
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

      {/* Delete Modal */}
      <div
        className="modal fade"
        id="delete_modal"
        tabIndex={-1}
        aria-labelledby="delete_modalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="delete_modalLabel">
                Delete Pharmacy User
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedPharmacy?.name}</strong>? This action cannot be
                undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pharmacies;
