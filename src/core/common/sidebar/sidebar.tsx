/* eslint-disable */

import { Link, useLocation, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import React, { useEffect, useState } from "react";
import { getSidebarDataByRole } from "./sidebarData";
import { useDispatch, useSelector } from "react-redux";
import { setExpandMenu, setMobileSidebar } from "../../redux/sidebarSlice";
import { updateTheme } from "../../redux/themeSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import { useAuth } from "../../context/AuthContext";
import { fetchHospitals, type Hospital } from "../../../api/hospitals";


const Sidebar = () => {
  const Location = useLocation();
  const [subOpen, setSubopen] = useState<any>("");
  const [subsidebar, setSubsidebar] = useState("");
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const toggleSidebar = (title: any) => {
    localStorage.setItem("menuOpened", title);
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: any) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

  const handleClick = (label: any) => {
    toggleSidebar(label);
  };

  const navigate = useNavigate();
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);

  const handleMiniSidebar = () => {
    const rootElement = document.documentElement;
    const isMini = rootElement.getAttribute("data-layout") === "mini";
    const updatedLayout = isMini ? "default" : "mini";
    dispatch(
      updateTheme({
        "data-layout": updatedLayout,
      })
    );
    if (isMini) {
      rootElement.classList.remove("mini-sidebar");
    } else {
      rootElement.classList.add("mini-sidebar");
    }
  };
  const onMouseEnter = () => {
    dispatch(setExpandMenu(true));
  };
  const onMouseLeave = () => {
    dispatch(setExpandMenu(false));
  };

  const handleLayoutClick = (layout: string) => {
    const layoutSettings: any = {
      "data-layout": "default",
      dir: "ltr",
    };

    switch (layout) {
      case "Default":
        layoutSettings["data-layout"] = "default";
        break;
      case "Hidden":
        layoutSettings["data-layout"] = "hidden";
        break;
      case "Mini":
        layoutSettings["data-layout"] = "mini";
        break;
      case "Hover View":
        layoutSettings["data-layout"] = "hoverview";
        break;
      case "Full Width":
        layoutSettings["data-layout"] = "full-width";
        break;
      case "RTL":
        layoutSettings.dir = "rtl";
        break;
      default:
        break;
    }
    dispatch(updateTheme(layoutSettings));
    navigate("/dashboard");
  };
  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );
   const toggleMobileSidebar = () => {
      dispatch(setMobileSidebar(!mobileSidebar));
    };
  useEffect(() => {
    const rootElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      rootElement.setAttribute(key, value);
    });
    if (themeSettings["data-layout"] === "mini") {
      rootElement.classList.add("mini-sidebar");
    } else {
      rootElement.classList.remove("mini-sidebar");
    }
  }, [themeSettings]);

  // Fetch hospitals for super_admin
  useEffect(() => {
    const loadHospitals = async () => {
      if (user?.role === "super_admin") {
        setLoadingHospitals(true);
        try {
          const hospitalsData = await fetchHospitals();
          setHospitals(hospitalsData);
          
          // Set selected hospital from localStorage or first hospital
          const savedHospitalId = localStorage.getItem("selectedHospitalId");
          if (savedHospitalId) {
            const savedHospital = hospitalsData.find(h => h._id === savedHospitalId);
            if (savedHospital) {
              setSelectedHospital(savedHospital);
            } else if (hospitalsData.length > 0) {
              setSelectedHospital(hospitalsData[0]);
              localStorage.setItem("selectedHospitalId", hospitalsData[0]._id || "");
            }
          } else if (hospitalsData.length > 0) {
            setSelectedHospital(hospitalsData[0]);
            localStorage.setItem("selectedHospitalId", hospitalsData[0]._id || "");
          }
        } catch (error) {
          console.error("Failed to fetch hospitals:", error);
        } finally {
          setLoadingHospitals(false);
        }
      }
    };

    loadHospitals();
  }, [user]);

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    localStorage.setItem("selectedHospitalId", hospital._id || "");
    // Optionally reload page or update context
    window.location.reload();
  };

  

  return (
    <>
      {/* Sidenav Menu Start */}
      <div
        className="sidebar"
        id="sidebar"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Start Logo */}
        <div className="sidebar-logo">
          <div>
            {/* Logo Normal */}
            <Link to={all_routes.dashboard} className="logo logo-normal">
              <ImageWithBasePath src="assets/img/logo.svg" alt="Logo" />
            </Link>
            {/* Logo Small */}
            <Link to={all_routes.dashboard} className="logo-small">
              <ImageWithBasePath src="assets/img/logo-small.svg" alt="Logo" />
            </Link>
            {/* Logo Dark */}
            <Link to={all_routes.dashboard} className="dark-logo">
              <ImageWithBasePath src="assets/img/logo-white.svg" alt="Logo" />
            </Link>
          </div>
          <button
            className="sidenav-toggle-btn btn border-0 p-0 active"
            id="toggle_btn"
            onClick={handleMiniSidebar}
          >
            <i className="ti ti-arrow-left" />
          </button>
          {/* Sidebar Menu Close */}
          <button className="sidebar-close"  onClick={toggleMobileSidebar}>
            <i className="ti ti-x align-middle" />
          </button>
        </div>
        {/* End Logo */}
        {/* Sidenav Menu */}
        <div className="sidebar-inner" data-simplebar="">
          <div id="sidebar-menu" className="sidebar-menu">
            {user?.role === "super_admin" && (
              <div className="sidebar-top shadow-sm p-2 rounded-1 mb-3 dropend">
                <Link
                  to="#"
                  className="drop-arrow-none"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                  data-bs-offset="0,22"
                  aria-haspopup="false"
                  aria-expanded="false"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span className="avatar rounded-circle flex-shrink-0 p-2">
                        <ImageWithBasePath
                          src="./assets/img/icons/trustcare.svg"
                          alt="img"
                        />
                      </span>
                      <div className="ms-2">
                        <h6 className="fs-14 fw-semibold mb-0">
                          {loadingHospitals ? "Loading..." : selectedHospital?.name || "Select Hospital"}
                        </h6>
                        <p className="fs-13 mb-0">
                          {selectedHospital ? `${selectedHospital.city}, ${selectedHospital.state}` : "No hospital selected"}
                        </p>
                      </div>
                    </div>
                    <i className="ti ti-arrows-transfer-up" />
                  </div>
                </Link>
                <div className="dropdown-menu dropdown-menu-lg">
                  <div className="p-2">
                    {loadingHospitals ? (
                      <div className="text-center p-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : hospitals.length === 0 ? (
                      <div className="text-center p-3 text-muted">
                        <p className="mb-2">No hospitals found</p>
                        <Link to={all_routes.addHospital} className="btn btn-sm btn-primary">
                          Add Hospital
                        </Link>
                      </div>
                    ) : (
                      <>
                        {hospitals.map((hospital, index) => (
                          <label
                            key={hospital._id || index}
                            className={`dropdown-item d-flex align-items-center justify-content-between p-1 ${
                              selectedHospital?._id === hospital._id ? "active" : ""
                            }`}
                            onClick={() => handleHospitalSelect(hospital)}
                            style={{ cursor: "pointer" }}
                          >
                            <span className="d-flex align-items-center">
                              <span className="me-2">
                                <ImageWithBasePath
                                  src={`assets/img/icons/clinic-0${(index % 4) + 1}.svg`}
                                  alt=""
                                />
                              </span>
                              <span className="fw-semibold text-dark">
                                {hospital.name}
                                <small className="d-block text-muted fw-normal fs-13">
                                  {hospital.city}, {hospital.state}
                                </small>
                              </span>
                            </span>
                            <input
                              className="form-check-input m-0 me-2"
                              type="radio"
                              checked={selectedHospital?._id === hospital._id}
                              onChange={() => handleHospitalSelect(hospital)}
                            />
                          </label>
                        ))}
                        <div className="dropdown-divider my-2"></div>
                        <Link
                          to={all_routes.addHospital}
                          className="dropdown-item d-flex align-items-center p-2 text-primary"
                        >
                          <i className="ti ti-plus me-2"></i>
                          <span className="fw-semibold">Add New Hospital</span>
                        </Link>
                        <Link
                          to={all_routes.hospitals}
                          className="dropdown-item d-flex align-items-center p-2"
                        >
                          <i className="ti ti-list me-2"></i>
                          <span>Manage Hospitals</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <ul>
              {getSidebarDataByRole(user?.role)?.map((mainLabel, index) => (
                <React.Fragment key={`main-${index}`}>
                  <li className="menu-title">
                    <span>{mainLabel?.tittle}</span>
                  </li>
                  <li>
                    <ul>
                      {mainLabel?.submenuItems?.map((title: any, i) => {
                        // Filter by role if specified
                        if (title.roles && user?.role && !title.roles.includes(user.role)) {
                          return null;
                        }

                        let link_array: any = [];
                        if ("submenuItems" in title) {
                          title.submenuItems?.forEach((link: any) => {
                            link_array.push(link?.link);
                            if (link?.submenu && "submenuItems" in link) {
                              link.submenuItems?.forEach((item: any) => {
                                link_array.push(item?.link);
                              });
                            }
                          });
                        }
                        title.links = link_array;

                        return (
                          <li className="submenu" key={`title-${i}`}>
                            <Link
                              to={title?.submenu ? "#" : title?.link}
                              onClick={() => {
                                handleClick(title?.label);

                                if (mainLabel?.tittle === "Layout") {
                                  handleLayoutClick(title?.label);
                                }
                              }}
                              className={`${
                                subOpen === title?.label ||
                                title?.links?.includes(Location.pathname)
                                  ? "subdrop"
                                  : ""
                              } ${
                                title?.links?.includes(Location.pathname) ||
                                title?.link === Location.pathname
                                  ? "active"
                                  : ""
                              }`}
                            >
                              <i className={`ti ti-${title.icon}`}></i>
                              <span>{title?.label}</span>
                              {(title?.submenu || title?.customSubmenuTwo) && (
                                <span className="menu-arrow"></span>
                              )}
                              {title?.submenu === false &&
                                title?.version === "v1.7.3" && (
                                  <span className="badge bg-danger ms-2 rounded-2 badge-md fs-12 fw-medium">
                                    v1.7.3
                                  </span>
                                )}
                            </Link>

                            {title?.submenu !== false && (
                              <ul
                                style={{
                                  display:
                                    subOpen === title?.label ||
                                    title?.links?.includes(Location.pathname)
                                      ? "block"
                                      : "none",
                                }}
                              >
                                {title?.submenuItems?.map(
                                  (item: any, j: any) => {
                                    const isSubActive =
                                      item?.submenuItems
                                        ?.map((link: any) => link?.link)
                                        .includes(Location.pathname) ||
                                      item?.link === Location.pathname;

                                    return (
                                      <li
                                        className={`${
                                          item?.submenuItems
                                            ? "submenu submenu-two"
                                            : ""
                                        } `}
                                        key={`item-${j}`}
                                      >
                                        <Link
                                          to={item?.submenu ? "#" : item?.link}
                                          className={`${
                                            isSubActive ? "active subdrop" : ""
                                          } ${
                                            subsidebar === item?.label
                                              ? "subdrop"
                                              : ""
                                          }`}
                                          onClick={() => {
                                            toggleSubsidebar(item?.label);
                                            if (title?.label === "Layouts") {
                                              handleLayoutClick(item?.label);
                                            }
                                          }}


                                        >
                                          {item?.label}
                                          {(item?.submenu ||
                                            item?.customSubmenuTwo) && (
                                            <span className="menu-arrow"></span>
                                          )}
                                        </Link>
                                        {item?.submenuItems ? (
                                          <ul
                                            style={{
                                              display:
                                                subsidebar === item?.label
                                                  ? "block"
                                                  : "none",
                                            }}
                                          >
                                            {item?.submenuItems?.map(
                                              (items: any, k: any) => {
                                                const isSubSubActive =
                                                  items?.submenuItems
                                                    ?.map(
                                                      (link: any) => link.link
                                                    )
                                                    .includes(
                                                      Location.pathname
                                                    ) ||
                                                  items?.link ===
                                                    Location.pathname;

                                                return (
                                                  <li key={`submenu-item-${k}`}>
                                                    <Link
                                                      to={
                                                        items?.submenu
                                                          ? "#"
                                                          : items?.link
                                                      }
                                                      className={`${
                                                        isSubSubActive
                                                          ? "active"
                                                          : ""
                                                      }`}
                                                    >
                                                      {items?.label}
                                                    </Link>
                                                  </li>
                                                );
                                              }
                                            )}
                                          </ul>
                                        ) : null}
                                      </li>
                                    );
                                  }
                                )}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </div>
          <div className="sidebar-footer border-top mt-3">
            
          </div>
        </div>
      </div>
      {/* Sidenav Menu End */}
    </>
  );
};

export default Sidebar;
