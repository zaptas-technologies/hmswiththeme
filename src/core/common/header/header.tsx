/* eslint-disable */
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import { useEffect, useState } from "react";
import { updateTheme } from "../../redux/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import { setMobileSidebar } from "../../redux/sidebarSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );

  const [isHiddenLayoutActive, setIsHiddenLayoutActive] = useState(() => {
    const saved = localStorage.getItem("hiddenLayoutActive");
    return saved ? JSON.parse(saved) : false;
  });

  /* ---------------- Theme Sync ---------------- */
  useEffect(() => {
    const htmlElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      htmlElement.setAttribute(key, value);
    });
  }, [themeSettings]);

  const handleUpdateTheme = (key: string, value: string) => {
    if (themeSettings["dir"] === "rtl" && key !== "dir") {
      dispatch(updateTheme({ dir: "ltr" }));
    }
    dispatch(updateTheme({ [key]: value }));
  };

  /* ---------------- Sidebar ---------------- */
  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };

  /* ---------------- Hidden Layout ---------------- */
  const handleToggleHiddenLayout = () => {
    if (themeSettings["data-layout"] === "hidden") {
      const newState = !isHiddenLayoutActive;
      setIsHiddenLayoutActive(newState);
      localStorage.setItem("hiddenLayoutActive", JSON.stringify(newState));
    }
  };

  useEffect(() => {
    const body = document.body;
    if (themeSettings["data-layout"] === "hidden") {
      body.classList.toggle("hidden-layout", isHiddenLayoutActive);
    } else {
      body.classList.remove("hidden-layout");
      setIsHiddenLayoutActive(false);
      localStorage.removeItem("hiddenLayoutActive");
    }
  }, [isHiddenLayoutActive, themeSettings["data-layout"]]);

  /* ---------------- User Helpers ---------------- */
  const getUserDisplayName = () =>
    user?.name || user?.email?.split("@")[0] || "User";

  const getUserRoleDisplay = () => {
    const roleMap: Record<string, string> = {
      doctor: "Doctor",
      admin: "Administrator",
      super_admin: "Super Administrator",
      hospital_admin: "Hospital Administrator",
      receptionist: "Receptionist",
      nurse: "Nurse",
      patient: "Patient",
      pharmacist: "Pharmacist",
      lab_technician: "Lab Technician",
      accountant: "Accountant",
    };
    return roleMap[user?.role] || user?.role || "User";
  };

  const getUserAvatar = () =>
    user?.avatar || "assets/img/users/user-01.jpg";

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <>
      {/* Topbar Start */}
      <header className="navbar-header">
        <div className="page-container topbar-menu">
          <div className="d-flex align-items-center gap-2">
            {/* Logo */}
            <Link to={all_routes.dashboard} className="logo">
              <span className="logo-light">
                <span className="logo-lg">
                  <ImageWithBasePath src="assets/img/logo.svg" alt="logo" />
                </span>
                <span className="logo-sm">
                  <ImageWithBasePath
                    src="assets/img/logo-small.svg"
                    alt="small logo"
                  />
                </span>
              </span>
              <span className="logo-dark">
                <span className="logo-lg">
                  <ImageWithBasePath
                    src="assets/img/logo-white.svg"
                    alt="dark logo"
                  />
                </span>
              </span>
            </Link>

            {/* Mobile Sidebar */}
            <Link
              id="mobile_btn"
              className="mobile-btn"
              to="#"
              onClick={toggleMobileSidebar}
            >
              <i className="ti ti-menu-deep fs-24" />
            </Link>

            {/* Hidden Layout Toggle */}
            <button
              className="sidenav-toggle-btn btn border-0 p-0 active"
              onClick={handleToggleHiddenLayout}
            >
              <i className="ti ti-arrow-right" />
            </button>

            {/* Desktop Search */}
            <div className="me-auto d-flex align-items-center header-search d-lg-flex d-none">
              <div className="input-icon-start position-relative me-2">
                <span className="input-icon-addon">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="text"
                  className="form-control shadow-sm"
                  placeholder="Search"
                />
                <span className="input-icon-addon text-dark shadow fs-18">
                  <i className="ti ti-command" />
                </span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="d-flex align-items-center">
            {/* Mobile Search */}
            <div className="header-item d-lg-none me-2">
              <button
                className="topbar-link btn btn-icon"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
              >
                <i className="ti ti-search fs-16" />
              </button>
            </div>

            {/* Appointment */}
            <div className="header-item me-2">
              <Link to={all_routes.newAppointment} className="btn topbar-link">
                <i className="ti ti-calendar-due" />
              </Link>
            </div>

            {/* Settings */}
            <div className="header-item me-2">
              <Link to={all_routes.profilesettings} className="btn topbar-link">
                <i className="ti ti-settings-2" />
              </Link>
            </div>

            {/* Light / Dark */}
            <div className="header-item d-none d-sm-flex me-2">
              <Link
                to="#"
                className={`btn btn-icon ${
                  themeSettings["data-bs-theme"] === "dark" ? "activate" : ""
                }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "light")}
              >
                <i className="ti ti-sun fs-16" />
              </Link>
              <Link
                to="#"
                className={`btn btn-icon ${
                  themeSettings["data-bs-theme"] === "light" ? "activate" : ""
                }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "dark")}
              >
                <i className="ti ti-moon fs-16" />
              </Link>
            </div>

            {/* User Dropdown */}
            {user && (
              <div className="dropdown profile-dropdown">
                <Link
                  to="#"
                  className="topbar-link dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <ImageWithBasePath
                    src={getUserAvatar()}
                    width={32}
                    height={32}
                    className="rounded-circle"
                    alt="user"
                  />
                </Link>

                <div className="dropdown-menu dropdown-menu-end p-2">
                  <div className="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                    <ImageWithBasePath
                      src={getUserAvatar()}
                      width={42}
                      height={42}
                      className="rounded-circle"
                      alt={getUserDisplayName()}
                    />
                    <div className="ms-2">
                      <p className="fw-medium mb-0">{getUserDisplayName()}</p>
                      <span className="fs-13 text-muted">
                        {getUserRoleDisplay()}
                      </span>
                    </div>
                  </div>

                  <Link to={all_routes.profilesettings} className="dropdown-item">
                    <i className="ti ti-user-circle me-1" /> Profile Settings
                  </Link>

                  <Link to={all_routes.transactions} className="dropdown-item">
                    <i className="ti ti-transition-right me-1" /> Transactions
                  </Link>

                  <div className="pt-2 mt-2 border-top">
                    <Link
                      to={all_routes.login}
                      onClick={handleLogout}
                      className="dropdown-item text-danger"
                    >
                      <i className="ti ti-logout me-1" /> Log Out
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <div className="modal fade" id="searchModal">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-transparent">
            <div className="card shadow-none">
              <div className="px-3 py-2 d-flex align-items-center">
                <i className="ti ti-search fs-22" />
                <input
                  type="search"
                  className="form-control border-0"
                  placeholder="Search"
                />
                <button
                  className="btn p-0"
                  data-bs-dismiss="modal"
                >
                  <i className="ti ti-x fs-22" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
