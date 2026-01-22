/* eslint-disable */
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import { useEffect, useState, useCallback } from "react";
import { updateTheme } from "../../redux/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import { setMobileSidebar } from "../../redux/sidebarSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  type Notification,
} from "../../../api/notifications";

const Header = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const [isHiddenLayoutActive, setIsHiddenLayoutActive] = useState(() => {
    const saved = localStorage.getItem("hiddenLayoutActive");
    return saved ? JSON.parse(saved) : false;
  });
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

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

  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );

  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };

  const handleToggleHiddenLayout = () => {
    // Only apply this functionality when layout is "hidden"
    if (themeSettings["data-layout"] === "hidden") {
      const newState = !isHiddenLayoutActive;
      setIsHiddenLayoutActive(newState);
      localStorage.setItem("hiddenLayoutActive", JSON.stringify(newState));
    }
  };

  // Sync body class with hidden layout state
  useEffect(() => {
    const bodyElement = document.body;
    if (themeSettings["data-layout"] === "hidden") {
      if (isHiddenLayoutActive) {
        bodyElement.classList.add("hidden-layout");
      } else {
        bodyElement.classList.remove("hidden-layout");
      }
    } else {
      bodyElement.classList.remove("hidden-layout");
      setIsHiddenLayoutActive(false);
      localStorage.removeItem("hiddenLayoutActive");
    }
  }, [isHiddenLayoutActive, themeSettings["data-layout"]]);

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Get user display name
  const getUserDisplayName = (): string => {
    if (!user) return "Guest";
    return user.name || user.email?.split("@")[0] || "User";
  };

  // Get user role display
  const getUserRoleDisplay = (): string => {
    if (!user) return "Guest";
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
    return roleMap[user.role] || user.role || "User";
  };

  // Get user avatar
  const getUserAvatar = (): string => {
    if (!user) return "assets/img/users/user-01.jpg";
    return user.avatar || "assets/img/users/user-01.jpg";
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetchNotifications({ limit: 10 });
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      setNotificationsError(error?.message || "Failed to load notifications");
      // eslint-disable-next-line no-console
      console.error("Failed to load notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete notification:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle logout
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
              {/* Logo Normal */}
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
              {/* Logo Dark */}
              <span className="logo-dark">
                <span className="logo-lg">
                  <ImageWithBasePath
                    src="assets/img/logo-white.svg"
                    alt="dark logo"
                  />
                </span>
              </span>
            </Link>
            {/* Sidebar Mobile Button */}
            <Link
              id="mobile_btn"
              className="mobile-btn"
              to="#"
              onClick={toggleMobileSidebar}
            >
              <i className="ti ti-menu-deep fs-24" />
            </Link>
            <button
              className="sidenav-toggle-btn btn border-0 p-0 active"
              id="toggle_btn2"
              onClick={handleToggleHiddenLayout}
            >
              <i className="ti ti-arrow-right" />
            </button>
            {/* Search */}
            <div className="me-auto d-flex align-items-center header-search d-lg-flex d-none">
              {/* Search */}
              <div className="input-icon-start position-relative me-2">
                <span className="input-icon-addon">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="text"
                  className="form-control shadow-sm"
                  placeholder="Search"
                />
                <span className="input-icon-addon text-dark shadow fs-18 d-inline-flex p-0 header-search-icon">
                  <i className="ti ti-command" />
                </span>
              </div>
              {/* /Search */}
            </div>
          </div>
          <div className="d-flex align-items-center">
            {/* Search for Mobile */}
            <div className="header-item d-flex d-lg-none me-2">
              <button
                className="topbar-link btn btn-icon"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
                type="button"
              >
                <i className="ti ti-search fs-16" />
              </button>
            </div>
            {/* AI Assistance */}
            {/* <Link
              to="#"
              className="btn btn-liner-gradient me-3 d-lg-flex d-none"
            >
              AI Assistance
              <i className="ti ti-chart-bubble-filled ms-1" />
            </Link> */}
            {/* AI Assistance */}
            {/* Appointment */}
            <div className="header-item">
              <div className="dropdown me-2">
                <Link to={all_routes.newAppointment} className="btn topbar-link">
                  <i className="ti ti-calendar-due" />
                </Link>
              </div>
            </div>
            {/* Appointment */}
            {/* Settings */}
            <div className="header-item">
              <div className="dropdown me-2">
                <Link to={all_routes.profilesettings} className="btn topbar-link">
                  <i className="ti ti-settings-2" />
                </Link>
              </div>
            </div>
            {/* Settings */}
            {/* Light/Dark Mode Button */}
            <div className="header-item d-none d-sm-flex me-2">
              <Link
                to="#"
                id="dark-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${
                  themeSettings["data-bs-theme"] === "dark" ? "activate" : ""
                }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "light")}
              >
                <i className="ti ti-sun fs-16" />
              </Link>
              {/* Light Mode Toggle */}
              <Link
                to="#"
                id="light-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${
                  themeSettings["data-bs-theme"] === "light" ? "activate" : ""
                }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "dark")}
              >
                <i className="ti ti-moon fs-16" />
              </Link>
            </div>
            {/* Notification Dropdown */}
            {/* <div className="header-item">
              <div className="dropdown me-3">
                <button
                  className="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none position-relative"
                  data-bs-toggle="dropdown"
                  data-bs-offset="0,24"
                  type="button"
                  aria-haspopup="false"
                  aria-expanded="false"
                  onClick={loadNotifications}
                >
                  <i className="ti ti-bell-check fs-16 animate-ring" />
                  {unreadCount > 0 && (
                    <span className="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount > 99 ? "99+" : unreadCount}
                      <span className="visually-hidden">unread notifications</span>
                    </span>
                  )}
                </button>
                <div
                  className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                  style={{ minHeight: 300, maxHeight: 500, overflowY: "auto" }}
                >
                  <div className="p-2 border-bottom">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                      </div>
                      {unreadCount > 0 && (
                        <div className="col-auto">
                          <button
                            className="btn btn-sm btn-link text-primary p-0"
                            onClick={handleMarkAllAsRead}
                            title="Mark all as read"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div
                    className="notification-body position-relative z-2 rounded-0"
                    data-simplebar=""
                  >
                    {notificationsLoading ? (
                      <div className="p-4 text-center">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 mb-0 fs-14 text-muted">Loading notifications...</p>
                      </div>
                    ) : notificationsError ? (
                      <div className="p-4 text-center">
                        <p className="text-danger mb-0 fs-14">{notificationsError}</p>
                        <button
                          className="btn btn-sm btn-link mt-2"
                          onClick={() => loadNotifications()}
                        >
                          Retry
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center">
                        <i className="ti ti-bell-off fs-32 text-muted mb-2 d-block" />
                        <p className="text-muted mb-0 fs-14">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`dropdown-item notification-item py-3 text-wrap ${
                            !notification.isRead ? "bg-light" : ""
                          } ${notifications.indexOf(notification) < notifications.length - 1 ? "border-bottom" : ""}`}
                        >
                          <div className="d-flex">
                            <div className="me-2 position-relative flex-shrink-0">
                              <ImageWithBasePath
                                src={notification.avatar || "assets/img/users/user-01.jpg"}
                                className="avatar-md rounded-circle"
                                alt={notification.title}
                              />
                              {!notification.isRead && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-white rounded-circle">
                                  <span className="visually-hidden">Unread</span>
                                </span>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-medium text-dark">{notification.title}</p>
                              <p className="mb-1 text-wrap">{notification.message}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-12 text-muted">
                                  <i className="ti ti-clock me-1" />
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                <div className="notification-action d-flex align-items-center float-end gap-2">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      className="notification-read rounded-circle bg-danger border-0 p-1"
                                      style={{ width: "20px", height: "20px" }}
                                      data-bs-toggle="tooltip"
                                      title="Mark as Read"
                                      aria-label="Mark as Read"
                                    />
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                    className="btn rounded-circle p-0 border-0"
                                    style={{ width: "24px", height: "24px" }}
                                    title="Delete"
                                    aria-label="Delete"
                                  >
                                    <i className="ti ti-x fs-14" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                
                  {notifications.length > 0 && (
                    <div className="p-2 rounded-bottom border-top text-center">
                      <Link
                        to={all_routes.notifications}
                        className="text-center text-decoration-underline fs-14 mb-0"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div> */}
            {/* User Dropdown */}
            {user && (
              <div className="dropdown profile-dropdown d-flex align-items-center justify-content-center">
                <Link
                  to="#"
                  className="topbar-link dropdown-toggle drop-arrow-none position-relative"
                  data-bs-toggle="dropdown"
                  data-bs-offset="0,22"
                  aria-haspopup="false"
                  aria-expanded="false"
                >
                  <ImageWithBasePath
                    src={getUserAvatar()}
                    width={32}
                    height={32}
                    className="rounded-circle d-flex"
                    alt="user-image"
                    onError={(e: any) => {
                      e.target.src = "assets/img/users/user-01.jpg";
                    }}
                  />
                  <span className="online text-success">
                    <i className="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white" />
                  </span>
                </Link>
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-md p-2">
                  <div className="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                    <ImageWithBasePath
                      src={getUserAvatar()}
                      className="rounded-circle"
                      width={42}
                      height={42}
                      alt={getUserDisplayName()}
                      onError={(e: any) => {
                        e.target.src = "assets/img/users/user-01.jpg";
                      }}
                    />
                    <div className="ms-2">
                      <p className="fw-medium text-dark mb-0">{getUserDisplayName()}</p>
                      <span className="d-block fs-13 text-muted">{getUserRoleDisplay()}</span>
                    </div>
                  </div>
                  {/* Item*/}
                  <Link to={all_routes.profilesettings} className="dropdown-item">
                    <i className="ti ti-user-circle me-1 align-middle" />
                    <span className="align-middle">Profile Settings</span>
                  </Link>
                  {/* Item*/}
                  <Link to={all_routes.profilesettings} className="dropdown-item">
                    <i className="ti ti-settings me-1 align-middle" />
                    <span className="align-middle">Account Settings</span>
                  </Link>
                  {/* item */}
                  <div className="form-check form-switch form-check-reverse d-flex align-items-center justify-content-between dropdown-item mb-0">
                    <label className="form-check-label" htmlFor="notify">
                      <i className="ti ti-bell me-1" />
                      Notifications
                    </label>
                    <input
                      className="form-check-input me-0"
                      type="checkbox"
                      role="switch"
                      id="notify"
                      defaultChecked
                    />
                  </div>
                  {/* Item*/}
                  <Link to={all_routes.transactions} className="dropdown-item">
                    <i className="ti ti-transition-right me-1 align-middle" />
                    <span className="align-middle">Transactions</span>
                  </Link>
                  {/* Item*/}
                  <div className="pt-2 mt-2 border-top">
                    <Link
                      to={all_routes.login}
                      onClick={handleLogout}
                      className="dropdown-item text-danger"
                    >
                      <i className="ti ti-logout me-1 fs-17 align-middle" />
                      <span className="align-middle">Log Out</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Topbar End */}
      {/* Search Modal */}
      <div className="modal fade" id="searchModal">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-transparent">
            <div className="card shadow-none mb-0">
              <div
                className="px-3 py-2 d-flex flex-row align-items-center"
                id="search-top"
              >
                <i className="ti ti-search fs-22" />
                <input
                  type="search"
                  className="form-control border-0"
                  placeholder="Search"
                />
                <button
                  type="button"
                  className="btn p-0"
                  data-bs-dismiss="modal"
                  aria-label="Close"
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
