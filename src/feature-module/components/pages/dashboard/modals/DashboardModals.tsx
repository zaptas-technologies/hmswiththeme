import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import {
  getDoctorImageSrc,
  type AdminStats,
  type AppointmentStatistics,
  type PopularDoctor,
  type RecentAppointmentItem,
  type TopDepartment,
  type ScheduleStats,
  type ScheduledDoctor,
  type IncomeByTreatment,
  type TopPatientItem,
  type RecentTransaction,
  type LeaveRequest,
  type AppointmentTrend,
  type DoctorPerformanceItem,
  type PatientPerformanceItem,
} from "../../../../../api/dashboard";

type ModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function DashboardModal({ show, onClose, title, children }: ModalProps) {
  if (!show) return null;
  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="presentation"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export function StatsModalContent({ data }: { data: AdminStats }) {
  const items = [
    { label: "Doctors", value: data.doctors.count, change: data.doctors.change },
    { label: "Patients", value: data.patients.count, change: data.patients.change },
    { label: "Appointments", value: data.appointments.count, change: data.appointments.change },
    { label: "Revenue", value: formatCurrency(data.revenue.amount), change: data.revenue.change },
  ];
  return (
    <div className="row g-3">
      {items.map((item) => (
        <div key={item.label} className="col-md-6">
          <div className="border rounded-2 p-3">
            <p className="text-muted mb-1">{item.label}</p>
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-bold fs-5">{item.value}</span>
              <span className={`badge ${item.change >= 0 ? "bg-success" : "bg-danger"}`}>
                {item.change >= 0 ? "+" : ""}{item.change}% (7 days)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppointmentStatisticsModalContent({ data }: { data: AppointmentStatistics }) {
  const items = [
    { label: "All Appointments", value: data.all, color: "primary" },
    { label: "Cancelled", value: data.cancelled, color: "danger" },
    { label: "Reschedule", value: data.reschedule, color: "warning" },
    { label: "Completed", value: data.completed, color: "success" },
  ];
  return (
    <div className="row g-3">
      {items.map((item) => (
        <div key={item.label} className="col-md-6">
          <div className={`bg-soft-${item.color} border border-${item.color} rounded-2 p-3`}>
            <p className="text-muted mb-1">{item.label}</p>
            <p className="fw-bold fs-4 mb-0">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PopularDoctorsModalContent({ data }: { data: PopularDoctor[] }) {
  return (
    <div className="row g-3">
      {data.map((doc, i) => (
        <div key={i} className="col-md-4">
          <Link to={all_routes.doctordetails} className="text-decoration-none">
            <div className="border rounded-2 p-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <ImageWithBasePath src={getDoctorImageSrc(doc.img)} alt="" className="rounded-circle me-2" style={{ width: 48, height: 48, objectFit: "cover" }} />
                <div>
                  <p className="fw-semibold mb-0 text-dark">{doc.name}</p>
                  <p className="text-muted small mb-0">{doc.role}</p>
                </div>
              </div>
              <p className="mb-0"><span className="fw-semibold">{doc.bookings}</span> Bookings</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export function RecentAppointmentsModalContent({ data }: { data: RecentAppointmentItem[] }) {
  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead><tr><th>Doctor</th><th>Patient</th><th>Date & Time</th><th>Mode</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((apt) => (
            <tr key={apt.id}>
              <td>{apt.doctor}</td>
              <td>{apt.patient}</td>
              <td>{formatDate(apt.dateTime)}</td>
              <td>{apt.mode}</td>
              <td><span className="badge bg-secondary">{apt.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopDepartmentsModalContent({ data }: { data: TopDepartment[] }) {
  return (
    <ul className="list-group list-group-flush">
      {data.map((dept, i) => (
        <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
          <span>{dept.name}</span>
          <span className="badge bg-primary rounded-pill">{dept.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScheduleModalContent({ scheduleStats, scheduledDoctors }: { scheduleStats: ScheduleStats; scheduledDoctors: ScheduledDoctor[] }) {
  return (
    <>
      <div className="row g-2 mb-4">
        <div className="col-4"><div className="border rounded-2 p-2 text-center"><p className="mb-0 small">Available</p><h5 className="mb-0">{scheduleStats.available}</h5></div></div>
        <div className="col-4"><div className="border rounded-2 p-2 text-center"><p className="mb-0 small">Unavailable</p><h5 className="mb-0">{scheduleStats.unavailable}</h5></div></div>
        <div className="col-4"><div className="border rounded-2 p-2 text-center"><p className="mb-0 small">Leave</p><h5 className="mb-0">{scheduleStats.leave}</h5></div></div>
      </div>
      <div className="list-group">
        {scheduledDoctors.map((doc) => (
          <div key={doc.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <ImageWithBasePath src={getDoctorImageSrc(doc.img)} alt="" className="rounded-circle me-2" style={{ width: 40, height: 40, objectFit: "cover" }} />
              <div>
                <Link to={`${all_routes.doctordetails}?id=${doc.id}`} className="fw-semibold">{doc.name}</Link>
                <p className="text-muted small mb-0">{doc.role || doc.department}</p>
              </div>
            </div>
            <Link to={all_routes.newAppointment} className="btn btn-primary btn-sm">Book</Link>
          </div>
        ))}
      </div>
    </>
  );
}

export function IncomeByTreatmentModalContent({ data }: { data: IncomeByTreatment[] }) {
  return (
    <ul className="list-group list-group-flush">
      {data.map((t, i) => (
        <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-semibold">{t.department}</span>
            <p className="text-muted small mb-0">{t.appointments} Appointments</p>
          </div>
          <span className="fw-bold">{formatCurrency(t.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TopPatientsModalContent({ data }: { data: TopPatientItem[] }) {
  return (
    <div className="list-group">
      {data.map((p, i) => (
        <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <ImageWithBasePath src={p.img || "assets/img/profiles/avatar-02.jpg"} alt="" className="rounded-circle me-2" style={{ width: 40, height: 40, objectFit: "cover" }} />
            <div>
              <Link to={all_routes.patientDetails} className="fw-semibold">{p.name}</Link>
              <p className="text-muted small mb-0">Total Paid: {formatCurrency(p.totalPaid)}</p>
            </div>
          </div>
          <span className="badge bg-primary">{p.appointments} Appointments</span>
        </div>
      ))}
    </div>
  );
}

export function RecentTransactionsModalContent({ data }: { data: RecentTransaction[] }) {
  return (
    <ul className="list-group list-group-flush">
      {data.map((t) => (
        <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-semibold">{t.type}</span>
            <p className="text-muted small mb-0">{t.invoice}</p>
          </div>
          <span className={t.amount >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
            {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LeaveRequestsModalContent({ data }: { data: LeaveRequest[] }) {
  return (
    <div className="list-group">
      {data.map((leave) => (
        <div key={leave.id} className="list-group-item d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <ImageWithBasePath src={getDoctorImageSrc(leave.doctorImg, "assets/img/profiles/avatar-16.jpg")} alt="" className="rounded-circle me-2" style={{ width: 40, height: 40, objectFit: "cover" }} />
            <div>
              <Link to={all_routes.doctordetails} className="fw-semibold">{leave.doctorName}</Link>
              <p className="text-muted small mb-0">{leave.days} {leave.days === 1 ? "Day" : "Days"} - {leave.reason}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppointmentTrendModalContent({ data }: { data: AppointmentTrend }) {
  return (
    <div className="small text-muted">
      <p className="mb-1">Categories: {data.categories.join(", ")}</p>
      <p className="mb-0">Total appointments by month (chart on main dashboard).</p>
    </div>
  );
}

export function DoctorsListModalContent({ data }: { data: DoctorPerformanceItem[] }) {
  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Department</th>
            <th className="text-end">Bookings</th>
            <th className="text-end">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <td>
                <div className="d-flex align-items-center">
                  <ImageWithBasePath
                    src={d.img || "assets/img/doctors/doctor-01.jpg"}
                    alt=""
                    className="rounded-circle me-2 flex-shrink-0"
                    style={{ width: 28, height: 28, objectFit: "cover" }}
                  />
                  <div>
                    <div className="fw-semibold">{d.name}</div>
                    <div className="text-muted small">{d.role}</div>
                  </div>
                </div>
              </td>
              <td>{d.department || "-"}</td>
              <td className="text-end">{d.bookings}</td>
              <td className="text-end fw-semibold">{formatCurrency(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientsListModalContent({ data }: { data: PatientPerformanceItem[] }) {
  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Phone</th>
            <th className="text-end">Appointments</th>
            <th className="text-end">Total Paid</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="d-flex align-items-center">
                  <ImageWithBasePath
                    src={p.img || "assets/img/profiles/avatar-02.jpg"}
                    alt=""
                    className="rounded-circle me-2 flex-shrink-0"
                    style={{ width: 28, height: 28, objectFit: "cover" }}
                  />
                  <div className="fw-semibold">{p.name}</div>
                </div>
              </td>
              <td>{p.phone || "-"}</td>
              <td className="text-end">{p.appointments}</td>
              <td className="text-end fw-semibold">{formatCurrency(p.totalPaid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
