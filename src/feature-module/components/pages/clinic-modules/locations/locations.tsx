import { Link } from "react-router";
import { useState, useEffect } from "react";
import Datatable from "../../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Modals from "./modals/modals";
import { fetchLocations, deleteLocation, type Location } from "../../../../../api/locations";

// Map backend Location to frontend display format
const mapLocationToDisplay = (location: Location) => {
  return {
    ...location,
    Clinic_Name: location.Location || location.Clinic_Name || "",
    img: location.img || "clinic-08.svg",
    Span: location.Span || (location.Status === "Active" ? "Active" : ""),
  };
};

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLocations();
      setLocations(data.map(mapLocationToDisplay));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load locations");
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;
    try {
      const locationId = selectedLocation.id || selectedLocation._id;
      if (!locationId) {
        alert("Location ID not found");
        return;
      }
      await deleteLocation(locationId);
      await loadLocations(); // Reload locations after delete
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete location");
      console.error("Error deleting location:", err);
    }
  };

  const data = locations;
  const columns = [
    {
      title: "Clinic Name",
      dataIndex: "Clinic_Name",
      render: (text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <ImageWithBasePath
              src={`assets/img/icons/${render.img}`}
              alt="img"
              className="rounded-circle"
            />
          </Link>
          <Link to="#" className="text-dark fw-semibold">
            {text}
          </Link>
          <span className="badge badge-soft-success border border-success fw-medium ms-2">
            {render.Span}
          </span>
        </div>
      ),
      sorter: (a: any, b: any) => a.Clinic_Name.length - b.Clinic_Name.length,
    },
    {
      title: "Address",
      dataIndex: "Address",
      sorter: (a: any, b: any) => a.Address.length - b.Address.length,
    },

    {
      title: "",
      render: (_: any, record: any) => (
        <div className="action-item">
          <Link to="#" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_modal"
                onClick={() => setSelectedLocation(record)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_modal"
                onClick={() => setSelectedLocation(record)}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
      sorter: (a: any, b: any) => (a.Status || "").length - (b.Status || "").length,
    },
  ];
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Locations
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Location : {loading ? "..." : locations.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <Link
                to="#"
                className="btn btn-primary fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_modal"
              >
                <i className="ti ti-plus me-1" />
                New Location
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-2"
                onClick={loadLocations}
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading locations...</p>
            </div>
          ) : (
            <>
              {/*  Start Table */}
              <div className="table-responsive">
                <Datatable
                  columns={columns}
                  dataSource={data}
                  Selection={false}
                  searchText={""}
                />
              </div>
              {/*  End Table */}
            </>
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
        selectedLocation={selectedLocation}
        onLocationSaved={() => {
          setSelectedLocation(null);
          loadLocations();
        }}
        onDelete={handleDelete}
      />
    </>
  );
};

export default Locations;
