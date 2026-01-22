import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchDashboard, type DashboardResponse } from "../../../../../api/dashboard";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Modals from "./modals/modals";
import SCol20Chart from "./charts/scol20";
import SCol5Chart from "./charts/scol5";
import SCol6Chart from "./charts/scol6";
import SCol7Chart from "./charts/scol7";
import CircleChart2 from "./charts/circleChart2";
import { all_routes } from "../../../../routes/all_routes";

const heroIcons = [
  { className: "ti ti-calendar-heart", tone: "primary" },
  { className: "ti ti-users", tone: "danger" },
  { className: "ti ti-versions", tone: "success" },
];

const DoctorDahboard = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await fetchDashboard();
        setData(payload);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const availability = data?.availability ?? [];
  const appointmentStats = data?.appointmentStats ?? {
    completed: 0,
    pending: 0,
    cancelled: 0,
  };
  const appointmentTrend = data?.appointmentTrend ?? {
    categories: [],
    total: [],
    completed: [],
  };
  const tiles = data?.tiles ?? [];
  const heroCards = data?.heroCards ?? [];
  const recentAppointments = data?.recentAppointments ?? [];
  const topPatients = data?.topPatients ?? [];

  const appointmentSeries = useMemo(
    () => [
      appointmentStats.completed,
      appointmentStats.pending,
      appointmentStats.cancelled,
    ],
    [appointmentStats]
  );

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      weekday: "long",
    });

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const statusClass = (status: string) => {
    if (status.toLowerCase().includes("checked out")) return "bg-success";
    if (status.toLowerCase().includes("checked in")) return "bg-warning";
    if (status.toLowerCase().includes("cancelled")) return "bg-danger";
    return "bg-info";
  };

  const renderHeroBadge = (direction: string, pct: number, tone: string) => {
    const label = `${direction === "down" ? "-" : "+"}${pct}%`;
    const badgeTone =
      tone === "danger"
        ? "bg-danger"
        : tone === "warning"
          ? "bg-warning"
          : "bg-success";
    return <span className={`badge fw-medium ${badgeTone} flex-shrink-0`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0 d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="mb-0">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrapper">
        <div className="content pb-0 d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <p className="text-danger fw-semibold mb-3">
              {error || "Unable to load dashboard data."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <h4 className="fw-bold mb-0">Doctor Dashboard</h4>
              <p className="mb-0 text-muted fs-13">
                Data refreshed {new Date(data.meta.generatedAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link
                to="#"
                className="btn btn-primary d-inline-flex align-items-center"
                data-bs-toggle="offcanvas"
                data-bs-target="#new_appointment"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
              <Link
                to="#"
                className="btn btn-outline-white bg-white d-inline-flex align-items-center"
              >
                <i className="ti ti-calendar-time me-1" />
                Schedule Availability
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/* row start */}
          <div className="row">
            {heroCards.map((card, idx) => {
              const IconMeta = heroIcons[idx % heroIcons.length];
              const SparkComponent = idx === 0 ? SCol5Chart : idx === 1 ? SCol6Chart : SCol7Chart;
              const arrow =
                card.deltaDirection === "down" ? (
                  <i className="ti ti-arrow-down ms-1" />
                ) : (
                  <i className="ti ti-arrow-up ms-1" />
                );
              const summary = card.changeSummary ?? "";
              const [summaryLead, ...summaryRest] = summary.split(" ");
              const summaryTail = summaryRest.join(" ").trim();

              return (
                <div className="col-xl-4 d-flex" key={card.id}>
                  <div className="card shadow-sm flex-fill w-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <p className="mb-1">{card.title}</p>
                          <div className="d-flex align-items-center gap-1">
                            <h3 className="fw-bold mb-0">{card.value}</h3>
                            {renderHeroBadge(card.deltaDirection, card.deltaPct, card.badgeTone)}
                          </div>
                        </div>
                        <span
                          className={`avatar border border-${IconMeta.tone} text-${IconMeta.tone} rounded-2 flex-shrink-0`}
                        >
                          <i className={`${IconMeta.className} fs-20`} />
                        </span>
                      </div>
                      <div className="d-flex align-items-end">
                        <SparkComponent data={card.spark.data} color={card.spark.color} />
                        <span
                          className={`badge fw-medium badge-soft-${
                            card.deltaDirection === "down" ? "danger" : "success"
                          } flex-shrink-0 ms-2`}
                        >
                          {summaryLead || `${card.deltaDirection === "down" ? "-" : "+"}${card.deltaPct}%`} {arrow}
                        </span>
                        <p className="ms-1 fs-13 text-truncate">
                          {summaryTail || "in last period"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-4 d-flex">
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0 text-truncate">
                    Upcoming Appointments
                  </h5>
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
                  <div className="d-flex align-items-center mb-3">
                    <Link to="#" className="avatar me-2 flex-shrink-0">
                      <ImageWithBasePath
                        src={data.upcoming.avatar}
                        alt="avatar"
                        className="rounded-circle"
                      />
                    </Link>
                    <div>
                      <h6 className="fs-14 mb-1 text-truncate">
                        <Link to="#" className="fw-semibold">
                          {data.upcoming.patientName}
                        </Link>
                      </h6>
                      <p className="mb-0 fs-13 text-truncate">{data.upcoming.patientCode}</p>
                    </div>
                  </div>
                  <h6 className="fs-14 fw-semibold mb-1">{data.upcoming.visitType}</h6>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-calendar-time text-dark me-1" />
                      {formatDate(data.upcoming.datetime)}
                    </p>
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-clock text-dark me-1" />
                      {formatTime(data.upcoming.datetime)}
                    </p>
                  </div>
                  <div className="row">
                    <div className="col">
                      <h6 className="fs-13 fw-semibold mb-1">Department</h6>
                      <p>{data.upcoming.department}</p>
                    </div>
                    <div className="col">
                      <h6 className="fs-13 fw-semibold mb-1">Type</h6>
                      <p className="text-truncate">{data.upcoming.mode}</p>
                    </div>
                  </div>
                  <div className="my-3 border-bottom pb-3">
                    {data.upcoming.appointmentId && data.upcoming.patientName !== "-" ? (
                      <Link
                        to={`${all_routes.onlineconsultations}?appointmentId=${data.upcoming.appointmentId}`}
                        className="btn btn-primary w-100"
                      >
                        Start Appointment
                      </Link>
                    ) : (
                      <button className="btn btn-primary w-100" disabled>
                        No Upcoming Appointment
                      </button>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Link to="#" className="btn btn-dark w-100">
                      <i className="ti ti-brand-hipchat me-1" />
                      Chat Now
                    </Link>
                    <Link to="#" className="btn btn-outline-white w-100">
                      <i className="ti ti-video me-1" />
                      Video Consultation
                    </Link>
                  </div>
                </div>
              </div>
              {/* card end */}
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-8 d-flex">
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Appointments</h5>
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
                  <div className="d-flex align-items-center justify-content-end gap-2 mb-1 flex-wrap mb-3">
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1 fs-18 text-primary" />
                      Total Appointments
                    </p>
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1 fs-18 text-success" />
                      Completed Appointments
                    </p>
                  </div>
                  <SCol20Chart
                    categories={appointmentTrend.categories}
                    total={appointmentTrend.total}
                    completed={appointmentTrend.completed}
                  />
                </div>
              </div>
              {/* card end */}
            </div>
            {/* col end */}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row row-cols-1 row-cols-xl-6 row-cols-md-3 row-cols-sm-2">
            {tiles.map((tile) => (
              <div className="col" key={tile.id}>
                <div className="card shadow-sm">
                  <div className="card-body">
                    <span className="avatar bg-primary rounded-2 fs-20 d-inline-flex mb-2">
                      <i className="ti ti-user" />
                    </span>
                    <p className="mb-1 text-truncate">{tile.label}</p>
                    <h3 className="fw-bold mb-2">{tile.value}</h3>
                    <p
                      className={`mb-0 text-${tile.tone === "danger" ? "danger" : "success"} text-truncate`}
                    >
                      {tile.trend}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* row start */}
          {/* row start */}
          <div className="row">
            <div className="col-12 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Recent Appointments</h5>
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
                  {/* Table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table border">
                      <thead className="thead-light">
                        <tr>
                          <th>Patient</th>
                          <th>Date &amp; Time</th>
                          <th>Mode</th>
                          <th>Status</th>
                          <th>Consultation Fees</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {recentAppointments.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Link to="#" className="avatar me-2">
                                  <ImageWithBasePath
                                    src={item.patient.avatar}
                                    alt="img"
                                    className="rounded-circle"
                                  />
                                </Link>
                                <div>
                                  <h6 className="fs-14 mb-1">
                                    <Link to="#" className="fw-medium">
                                      {item.patient.name}
                                    </Link>
                                  </h6>
                                  <p className="mb-0 fs-13">{item.patient.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              {formatDate(item.datetime)} - {formatTime(item.datetime)}
                            </td>
                            <td>{item.mode}</td>
                            <td>
                              <span className={`badge ${statusClass(item.status)} fw-medium`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="fw-semibold text-dark">
                              ${item.fee.toLocaleString()}
                            </td>
                            <td>
                              {item.status !== "Checked Out" && item.status !== "Cancelled" ? (
                                <Link
                                  to={`${all_routes.onlineconsultations}?appointmentId=${item.id}`}
                                  className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
                                  title="Start Consultation"
                                >
                                  <i className="ti ti-calendar-plus" />
                                </Link>
                              ) : (
                                <span className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1 text-muted" title="Appointment completed">
                                  <i className="ti ti-check" />
                                </span>
                              )}
                              <Link
                                to="#"
                                data-bs-toggle="dropdown"
                                className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <ul className="dropdown-menu p-2">
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item d-flex align-items-center"
                                    data-bs-toggle="offcanvas"
                                    data-bs-target="#edit_appointment"
                                  >
                                    <i className="ti ti-edit me-2" />
                                    Edit
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item d-flex align-items-center"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                  >
                                    <i className="ti ti-trash me-2" />
                                    Delete
                                  </Link>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        ))}
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
                  <h5 className="fw-bold mb-0">Availability</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Trustcare Clinic <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          CureWell Medical Hub
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Trustcare Clinic
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          NovaCare Medical
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Greeny Medical Clinic
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {availability.map((slot) => (
                    <div
                      className={`d-flex align-items-center justify-content-between mb-2 ${
                        slot.day === "Sun" ? "pb-2" : "border-bottom pb-2"
                      }`}
                      key={slot.day}
                    >
                      <p className="text-dark fw-semibold mb-0">{slot.day}</p>
                      <p
                        className={`mb-0 d-inline-flex align-items-center ${
                          slot.window ? "" : "text-danger"
                        }`}
                      >
                        <i className="ti ti-clock me-1" />
                        {slot.window ?? "Closed"}
                      </p>
                    </div>
                  ))}
                  <Link to="#" className="btn btn-light w-100 mt-2 fs-13">
                    Edit Availability
                  </Link>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0 text-truncate">
                    Appointment Statistics
                  </h5>
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
                <div className="card-body">
                  <CircleChart2 series={appointmentSeries} />
                  <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                    <div className="text-center">
                      <p className="d-flex align-items-center mb-1 fs-13">
                        <i className="ti ti-circle-filled text-success fs-10 me-1" />
                        Completed
                      </p>
                      <h5 className="fw-bold mb-0">{appointmentStats.completed}</h5>
                    </div>
                    <div className="text-center">
                      <p className="d-flex align-items-center mb-1 fs-13">
                        <i className="ti ti-circle-filled text-warning fs-10 me-1" />
                        Pending
                      </p>
                      <h5 className="fw-bold mb-0">{appointmentStats.pending}</h5>
                    </div>
                    <div className="text-center">
                      <p className="d-flex align-items-center mb-1 fs-13">
                        <i className="ti ti-circle-filled text-danger fs-10 me-1" />
                        Cancelled
                      </p>
                      <h5 className="fw-bold mb-0">{appointmentStats.cancelled}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Top Patients</h5>
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
                  {topPatients.map((patient) => (
                    <div
                      className="d-flex align-items-center justify-content-between mb-4"
                      key={patient.id}
                    >
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar me-2 flex-shrink-0">
                          <ImageWithBasePath
                            src={patient.avatar}
                            alt="img"
                            className="rounded-circle"
                          />
                        </Link>
                        <div>
                          <h6 className="fs-14 mb-1 text-truncate">
                            <Link to="#" className="fw-medium">
                              {patient.name}
                            </Link>
                          </h6>
                          <p className="mb-0 fs-13 text-truncate">{patient.phone}</p>
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
          </div>
          {/* row end */}
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
      <Modals />
    </>
  );
};

export default DoctorDahboard;
