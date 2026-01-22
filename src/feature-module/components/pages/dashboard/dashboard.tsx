import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import SCol2Chart from "./chats/scol2";
import SCol3Chart from "./chats/scol3";
import SCol4Chart from "./chats/scol4";
import SCol19Chart from "./chats/scol19";
import CircleChart from "./chats/circleChart";
import { Calendar, type CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import { fetchAdminDashboard, type AdminDashboardResponse } from "../../../../api/dashboard";
import dayjs from "dayjs";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sColChart] = useState<any>({
    chart: {
      width: 80,
      height: 54,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 3,
        endingShape: "rounded",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: { enabled: false },
    colors: [
      "#2E37A4", // default color
      "#2E37A4",
      "#2E37A4",
      "#2E37A4",
      "#FF955A", // highlighted bar
      "#2E37A4",
      "#2E37A4",
    ],
    fill: {
      type: "solid",
    },
  });


  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminDashboard();
        setDashboardData(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load dashboard");
        // eslint-disable-next-line no-console
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    console.log(value.format("YYYY-MM-DD"), mode);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return dayjs(dateString).format("DD MMM YYYY, hh:mm A");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="alert alert-danger" role="alert">
            {error || "Failed to load dashboard data"}
          </div>
        </div>
      </div>
    );
  }

  const { stats, appointmentStatistics, popularDoctors, recentAppointments, topDepartments, scheduleStats, scheduledDoctors, incomeByTreatment, topPatients, recentTransactions, leaveRequests } = dashboardData;

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content pb-0">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-0">Admin Dashboard </h4>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link
                to={all_routes.newAppointment}
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
              <Link
                to={all_routes.doctorschedule}
                className="btn btn-outline-white bg-white d-inline-flex align-items-center"
              >
                <i className="ti ti-calendar-time me-1" />
                Schedule Availability
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/* start row */}
          <div className="row">
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-01.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-primary rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className={`badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 ${stats.doctors.change >= 0 ? "bg-success" : "bg-danger"}`}>
                        {stats.doctors.change >= 0 ? "+" : ""}{stats.doctors.change}%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Doctors</p>
                      <h3 className="fw-bold mb-0">{stats.doctors.count}</h3>
                    </div>
                    <div>
                      <div id="s-col" className="chart-set">
                        <Chart
                          options={sColChart}
                          series={[{ name: "Data", data: stats.doctors.sparkline }]}
                          type="bar"
                          width={80}
                          height={54}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-02.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-danger rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className={`badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 ${stats.patients.change >= 0 ? "bg-success" : "bg-danger"}`}>
                        {stats.patients.change >= 0 ? "+" : ""}{stats.patients.change}%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Patients</p>
                      <h3 className="fw-bold mb-0">{stats.patients.count}</h3>
                    </div>
                    <div>
                      <div id="s-col-2" className="chart-set">
                        <SCol2Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-03.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-info rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className={`badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 ${stats.appointments.change >= 0 ? "bg-success" : "bg-danger"}`}>
                        {stats.appointments.change >= 0 ? "+" : ""}{stats.appointments.change}%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Appointment</p>
                      <h3 className="fw-bold mb-0">{stats.appointments.count}</h3>
                    </div>
                    <div>
                      <div id="s-col-3" className="chart-set">
                        <SCol3Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-04.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-success rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className={`badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 ${stats.revenue.change >= 0 ? "bg-success" : "bg-danger"}`}>
                        {stats.revenue.change >= 0 ? "+" : ""}{stats.revenue.change}%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between overflow-hidden">
                    <div>
                      <p className="mb-1">Revenue</p>
                      <h3 className="fw-bold mb-0 text-truncate">{formatCurrency(stats.revenue.amount)}</h3>
                    </div>
                    <div>
                      <div id="s-col-4" className="chart-set">
                        <SCol4Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-8">
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Appointment Statistics</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Monthly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div className="row row-gap-3 mb-2">
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate">
                          <i className="ti ti-point-filled me-1 text-primary" />
                          All Appointments
                        </p>
                        <h5 className="fw-bold mb-0">{appointmentStatistics.all}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-danger" />
                          Cancelled
                        </p>
                        <h5 className="fw-bold mb-0">{appointmentStatistics.cancelled}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-warning" />
                          Reschedule
                        </p>
                        <h5 className="fw-bold mb-0">{appointmentStatistics.reschedule}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-success" />
                          Completed
                        </p>
                        <h5 className="fw-bold mb-0">{appointmentStatistics.completed}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="chart-set" id="s-col-19">
                    <SCol19Chart />
                  </div>
                </div>
              </div>
              {/* card end */}
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Popular Doctors</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Weekly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row row-gap-3">
                    {popularDoctors.slice(0, 3).map((doctor, index) => (
                      <div key={index} className="col-md-4">
                        <div className="border shadow-sm p-3 rounded-2">
                          <div className="d-flex align-items-center mb-3">
                            <Link
                              to={all_routes.doctordetails}
                              className="avatar me-2 flex-shrink-0 position-relative"
                            >
                              <span className="online text-success position-absolute end-0 bottom-0 pe-1">
                                <i className="ti ti-circle-filled d-flex bg-white fs-6 rounded-circle border border-1 border-white" />
                              </span>
                              <ImageWithBasePath
                                src={doctor.img || "assets/img/doctors/doctor-01.jpg"}
                                alt="img"
                                className="rounded-circle"
                              />
                            </Link>
                            <div>
                              <h6 className="fs-14 mb-1 text-truncate">
                                <Link
                                  to={all_routes.doctordetails}
                                  className="fw-semibold"
                                >
                                  {doctor.name}
                                </Link>
                              </h6>
                              <p className="mb-0 fs-13">{doctor.role}</p>
                            </div>
                          </div>
                          <p className="mb-0">
                            <span className="text-dark fw-semibold">{doctor.bookings}</span>
                            Bookings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* card end */}
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4">
              <div className="card shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0 text-truncate">Appointments</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      All Type <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          In Person
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Online
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="datepic appointment-calender mb-1">
                    <Calendar
                      fullscreen={false}
                      onPanelChange={onPanelChange}
                    />
                  </div>
                  {recentAppointments.slice(0, 3).map((appointment, index) => {
                    const bgClass = index === 0 ? "bg-light" : index === 1 ? "bg-soft-danger" : "bg-soft-info";
                    return (
                      <div key={appointment.id} className={`mb-3 ${bgClass} p-3 rounded-2 d-flex align-items-center justify-content-between`}>
                        <div>
                          <h6 className="fs-14 fw-semibold mb-1">{appointment.mode || "General Visit"}</h6>
                          <p className="mb-0 text-truncate">
                            <i className="ti ti-calendar-time me-1 text-dark" />
                            {formatDate(appointment.dateTime)}
                          </p>
                        </div>
                        <div className="avatar-list-stacked avatar-group-sm event flex-shrink-0">
                          <span className="avatar avatar-lg rounded-circle border-0">
                            <ImageWithBasePath
                              src={appointment.patientImg || "assets/img/profiles/avatar-26.jpg"}
                              className="img-fluid rounded-circle border border-white"
                              alt="Img"
                            />
                          </span>
                          <span className="avatar avatar-lg rounded-circle border-0">
                            <ImageWithBasePath
                              src={appointment.doctorImg || "assets/img/doctors/doctor-05.jpg"}
                              className="img-fluid rounded-circle border border-white"
                              alt="Img"
                            />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <Link
                    to={all_routes.appointments}
                    className="btn btn-light w-100"
                  >
                    View All Appointments
                  </Link>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* end row */}
          {/* start row */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-4 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Top 3 Departments</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Weekly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div id="circle-chart" className="chart-set">
                    <CircleChart departments={topDepartments} />
                  </div>
                  <div className="d-flex align-items-center flex-wrap justify-content-center gap-2 mt-3">
                    {topDepartments.slice(0, 3).map((dept, index) => {
                      const colors = ["text-info", "text-purple", "text-primary"];
                      return (
                        <p key={index} className="d-flex align-items-center mb-0 fs-13">
                          <i className={`ti ti-circle-filled ${colors[index]} fs-10 me-1`} />
                          <span className="text-dark fw-semibold me-1">{dept.count}</span>
                          {dept.name}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Doctors Schedule</h5>
                  <Link
                    to={all_routes.doctorschedule}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <div className="row g-2 mb-4">
                    <div className="col d-flex border-end">
                      <div className="text-center flex-fill">
                        <p className="mb-1">Available</p>
                        <h3 className="fw-bold mb-0">{scheduleStats.available}</h3>
                      </div>
                    </div>
                    <div className="col d-flex border-end">
                      <div className="text-center flex-fill">
                        <p className="mb-1">Unavailable</p>
                        <h3 className="fw-bold mb-0">{scheduleStats.unavailable}</h3>
                      </div>
                    </div>
                    <div className="col d-flex">
                      <div className="text-center flex-fill">
                        <p className="mb-1">Leave</p>
                        <h3 className="fw-bold mb-0">{scheduleStats.leave}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    {scheduledDoctors.length > 0 ? (
                      scheduledDoctors.map((doctor, index) => (
                        <div key={doctor.id} className={`d-flex justify-content-between align-items-center ${index < scheduledDoctors.length - 1 ? "mb-3" : "mb-0"}`}>
                          <div className="d-flex align-items-center flex-shrink-0">
                            <Link
                              to={`${all_routes.doctordetails}?id=${doctor.id}`}
                              className="avatar flex-shrink-0"
                            >
                              <ImageWithBasePath
                                src={doctor.img || "assets/img/doctors/doctor-01.jpg"}
                                className="rounded-circle"
                                alt="img"
                              />
                            </Link>
                            <div className="ms-2 flex-shrink-0">
                              <div>
                                <h6 className="fw-semibold fs-14 text-truncate mb-1">
                                  <Link to={`${all_routes.doctordetails}?id=${doctor.id}`}>
                                    {doctor.name}
                                  </Link>
                                </h6>
                                <p className="fs-13">{doctor.role || doctor.department || "Doctor"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ms-2">
                            <Link
                              to={all_routes.newAppointment}
                              className="btn btn-primary btn-sm py-1 flex-shrink-0"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted mb-0">No available doctors at the moment</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Income By Treatment</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Weekly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {incomeByTreatment.map((treatment, index) => (
                    <div key={index} className={`d-flex align-items-center justify-content-between ${index < incomeByTreatment.length - 1 ? "mb-3" : "mb-0"}`}>
                      <div>
                        <p className="fw-semibold mb-1 text-dark">{treatment.department}</p>
                        <p className="mb-0">{treatment.appointments.toLocaleString()} Appointments</p>
                      </div>
                      <h6 className="fw-bold mb-0">{formatCurrency(treatment.revenue)}</h6>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row">
            <div className="col-12 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">All Appointments</h5>
                  <Link
                    to={all_routes.appointments}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {/* Table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table border">
                      <thead className="thead-light">
                        <tr>
                          <th>Doctor</th>
                          <th>Patient</th>
                          <th>Date &amp; Time</th>
                          <th>Mode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAppointments.slice(0, 5).map((appointment) => {
                          const getStatusBadgeClass = (status: string) => {
                            if (status === "Confirmed" || status === "Checked Out" || status === "Completed") {
                              return "badge-soft-success border border-success rounded text-success";
                            }
                            if (status === "Cancelled") {
                              return "badge-soft-danger border border-danger rounded";
                            }
                            if (status === "Schedule") {
                              return "badge-soft-info border border-info rounded";
                            }
                            return "badge-soft-secondary border border-secondary rounded";
                          };
                          return (
                            <tr key={appointment.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    to={all_routes.doctordetails}
                                    className="avatar me-2"
                                  >
                                    <ImageWithBasePath
                                      src={appointment.doctorImg || "assets/img/doctors/doctor-01.jpg"}
                                      alt="img"
                                      className="rounded-circle"
                                    />
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-1">
                                      <Link
                                        to={all_routes.doctordetails}
                                        className="fw-semibold"
                                      >
                                        {appointment.doctor}
                                      </Link>
                                    </h6>
                                    <p className="mb-0 fs-13">Doctor</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    to={all_routes.patientDetails}
                                    className="avatar me-2"
                                  >
                                    <ImageWithBasePath
                                      src={appointment.patientImg || "assets/img/profiles/avatar-02.jpg"}
                                      alt="img"
                                      className="rounded-circle"
                                    />
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-1">
                                      <Link
                                        to={all_routes.patientDetails}
                                        className="fw-medium"
                                      >
                                        {appointment.patient}
                                      </Link>
                                    </h6>
                                    <p className="mb-0 fs-13">Patient</p>
                                  </div>
                                </div>
                              </td>
                              <td>{formatDate(appointment.dateTime)}</td>
                              <td>{appointment.mode}</td>
                              <td>
                                <span className={`badge fs-13 py-1 ${getStatusBadgeClass(appointment.status)} fw-medium`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Table end */}
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-4 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Top 5 Patients</h5>
                  <Link
                    to={all_routes.patients}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {topPatients.map((patient, index) => (
                    <div key={index} className={`d-flex justify-content-between align-items-center ${index < topPatients.length - 1 ? "mb-3" : "mb-0"}`}>
                      <div className="d-flex align-items-center">
                        <Link
                          to={all_routes.patientDetails}
                          className="avatar me-2 flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src={patient.img || "assets/img/profiles/avatar-02.jpg"}
                            alt="img"
                            className="rounded-circle"
                          />
                        </Link>
                        <div>
                          <h6 className="fs-14 mb-1 text-truncate">
                            <Link
                              to={all_routes.patientDetails}
                              className="fw-medium"
                            >
                              {patient.name}
                            </Link>
                          </h6>
                          <p className="mb-0 fs-13 text-truncate">
                            Total Paid : {formatCurrency(patient.totalPaid)}
                          </p>
                        </div>
                      </div>
                      <span className="badge fw-medium badge-soft-primary border border-primary flex-shrink-0">
                        {patient.appointments} Appointments
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Recent Transactions</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Weekly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className={`d-flex justify-content-between align-items-center ${index < recentTransactions.length - 1 ? "mb-3" : "mb-0"}`}>
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar me-2 flex-shrink-0">
                          <ImageWithBasePath
                            src="assets/img/icons/stripe.svg"
                            alt="img"
                            className="rounded-circle"
                          />
                        </Link>
                        <div>
                          <h6 className="fs-14 mb-1 text-truncate">
                            <Link to="#" className="fw-semibold">
                              {transaction.type}
                            </Link>
                          </h6>
                          <p className="mb-0 fs-13 text-truncate">
                            <Link to="#" className="link-primary">
                              {transaction.invoice}
                            </Link>
                          </p>
                        </div>
                      </div>
                      <span className={`badge fw-medium flex-shrink-0 ${transaction.amount >= 0 ? "bg-success" : "bg-danger"}`}>
                        {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Leave Requests</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Today <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Today
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          This Month
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {leaveRequests.map((leave, index) => (
                    <div key={leave.id} className={`d-flex justify-content-between ${index < leaveRequests.length - 1 ? "mb-3" : "mb-0"}`}>
                      <div className="d-flex align-items-center">
                        <Link
                          to={all_routes.doctordetails}
                          className="avatar flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src={leave.doctorImg || "assets/img/profiles/avatar-16.jpg"}
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2">
                          <div>
                            <h6 className="fw-semibold text-truncate mb-1 fs-14">
                              <Link to={all_routes.doctordetails}>
                                {leave.doctorName}
                              </Link>
                            </h6>
                            <p className="fs-13 mb-0 text-truncate">
                              {leave.days} {leave.days === 1 ? "Day" : "Days"} - {leave.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <Link
                          to="#"
                          className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                        >
                          <i className="ti ti-x fw-bold" />
                        </Link>
                        <Link
                          to="#"
                          className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                        >
                          <i className="ti ti-check fw-bold" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2026©
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
    </>
  );
};

export default Dashboard;
