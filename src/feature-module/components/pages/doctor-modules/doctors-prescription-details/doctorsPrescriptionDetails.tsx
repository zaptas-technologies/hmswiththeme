import { Link, useSearchParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { fetchPrescriptionById, type Prescription } from "../../../../../api/prescriptions";

const DoctorsPrescriptionDetails = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Missing prescription id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchPrescriptionById(id);
        setPrescription(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load prescription");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const medicines = useMemo(() => {
    if (!prescription) return [];
    const meds = (prescription as any).Medications;
    if (Array.isArray(meds) && meds.length > 0) return meds;
    // Fallback for legacy single medicine fields
    if (prescription.Medicine) {
      return [
        {
          medicine: prescription.Medicine,
          dosage: prescription.Dosage,
          frequency: prescription.Frequency,
          duration: prescription.Duration,
        },
      ];
    }
    return [];
  }, [prescription]);

  const prescribedOnLabel = useMemo(() => {
    const d = (prescription?.Prescribed_On || prescription?.Date || "") as string;
    if (!d) return "N/A";
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format("DD MMM YYYY") : d;
  }, [prescription?.Prescribed_On, prescription?.Date]);

  const handlePrint = () => window.print();
  const handleDownload = () => window.print(); // browser "Save as PDF"

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="mb-0">Loading prescription…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <p className="text-danger fw-semibold mb-3">{error || "Unable to load prescription."}</p>
            <Link to={all_routes.doctorsprescriptions} className="btn btn-primary">
              Back to Prescriptions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const prescriptionNo = prescription.Prescription_ID || (prescription as any).PrescriptionId || prescription._id || "N/A";

  return (
    <>
      {/* Print-specific styles to hide navigation */}
      <style>{`
        @media print {
          /* Hide all navigation, header, sidebar elements */
          .navbar-header,
          .navbar,
          .header,
          .sidebar,
          .sidebar-wrapper,
          .sidebar-logo,
          .sidebar-menu,
          .sidebar-inner,
          .sidebar-footer,
          .topbar,
          .topbar-menu,
          .page-header,
          .page-title,
          nav,
          header,
          aside,
          .btn,
          /* Hide back navigation link */
          .d-flex.align-items-sm-center.flex-sm-row.flex-column.mb-4,
          /* Hide modals */
          .modal,
          /* Hide footer */
          footer,
          .p-3.bg-white.border-1.border-top,
          /* Hide print/download buttons */
          .text-center.d-flex.align-items-center.justify-content-center {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Reset body margins for print */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ensure page-wrapper takes full width and starts at top */
          .page-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
          }
          
          /* Content should be full width */
          .content {
            margin: 0 !important;
            padding: 20px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Card should be full width and no shadows */
          .card {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
          
          .card-body {
            padding: 20px !important;
          }
          
          /* Ensure table prints properly */
          .table-responsive {
            overflow: visible !important;
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          /* Prevent page breaks inside important sections */
          .card-body > div {
            page-break-inside: avoid;
          }
          
          /* Ensure images print */
          img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* start row*/}
          <div className="row">
            <div className="col-lg-10 mx-auto">
              {/* start page header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column mb-4">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center ">
                    <Link to={all_routes.doctorsprescriptions} className="me-1">
                      <i className="ti ti-chevron-left" /> Prescriptions
                    </Link>
                  </h6>
                </div>
              </div>
              {/* end page header */}
              <div className="card">
                <div className="card-body">
                  {/* Items */}
                  <div className="d-flex align-items-center justify-content-between border-1 border-bottom pb-3 mb-3">
                    <ImageWithBasePath src="assets/img/logo.svg" alt="" />
                    <span className="badge bg-info-subtle text-info-emphasis fs-13 fw-medium border border-primary py-1 px-2">
                      {prescriptionNo}
                    </span>
                  </div>
                  {/* Items */}
                  <div className="d-flex align-items-center justify-content-between border-1 border-bottom pb-3 mb-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar avatar-xxl rounded bg-light border p-2">
                        <ImageWithBasePath
                          src="./assets/img/icons/trust-care.svg"
                          alt="favicon.png"
                          className="img-fluid img1 "
                        />
                      </div>
                      <div>
                        <h6 className="text-dark fw-semibold mb-1">
                          {(prescription as any)?.Hospital_Name || "Clinic"}
                        </h6>
                        <p className="mb-1"> {(prescription as any)?.Doctor || "Doctor"} </p>
                        <p className="mb-0"> {(prescription as any)?.role || ""}</p>
                      </div>
                    </div>
                    <div className="text-lg-end">
                      <p className="text-dark mb-1">
                        Department :
                        <span className="text-body"> {(prescription as any)?.Department || "N/A"}</span>
                      </p>
                      <p className="text-dark mb-1">
                        Prescribed on :
                        <span className="text-body"> {prescribedOnLabel}</span>
                      </p>
                      <p className="text-dark mb-0">
                        Consultation :
                        <span className="text-body"> {(prescription as any)?.consultationId || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="mb-3">
                    <h6 className=" mb-2 fs-14 fw-medium"> Patient Details </h6>
                    <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between">
                      <h6 className="m-0 fw-semibold fs-16"> {prescription.Patient || "N/A"} </h6>
                      <div className="d-flex align-items-center  gap-3">
                        <p className="mb-0 text-dark">
                          Patient ID <span className="text-body"> {prescription.patientId || "N/A"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="mb-4">
                    <h6 className="mb-3 fs-16 fw-semibold text-center">
                      Cardiology Prescription
                    </h6>
                    <div className="">
                      {/* Table List */}
                      <div className="table-responsive border bg-white">
                        <table className="table table-nowrap">
                          <thead className="table-light">
                            <tr>
                              <th className="text-dark">SNO</th>
                              <th className="text-dark">Medecine Name</th>
                              <th className="text-dark">Dosage</th>
                              <th className="text-dark"> Frequency</th>
                              <th className="text-dark"> Duration </th>
                              <th className="text-dark"> Timings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {medicines.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-3">
                                  No medicines found.
                                </td>
                              </tr>
                            ) : (
                              medicines.map((m: any, idx: number) => (
                                <tr key={`${m?.medicine || "med"}-${idx}`}>
                                  <td>{String(idx + 1).padStart(2, "0")}</td>
                                  <td>{m?.medicine || "N/A"}</td>
                                  <td>{m?.dosage || "-"}</td>
                                  <td>{m?.frequency || "-"}</td>
                                  <td>{m?.duration || "-"}</td>
                                  <td>{m?.timing || "-"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* /Table List */}
                    </div>
                  </div>
                  {/* Items */}
                  <div className="pb-3 mb-3 border-1 border-bottom">
                    <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
                    <p className="mb-0">{(prescription as any)?.AdviceText || "-"}</p>
                  </div>
                  {/* Items */}
                  <div className="pb-3 mb-3 border-1 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="">
                      <h6 className="mb-1 16-14 fw-semibold"> Follow Up</h6>
                      <p className="mb-0">{(prescription as any)?.FollowUpText || "-"}</p>
                    </div>
                    <div className="">
                      <ImageWithBasePath
                        src="assets/img/icons/signature-img.svg"
                        alt=""
                        className="img-fluid "
                      />
                      <h6 className="fs-14 fw-semibold"> Dr. Mick Thompson </h6>
                      <p className="fs-13 fw-normal"> MD Cardiologist </p>
                    </div>
                  </div>
                  <div className="text-center d-flex align-items-center justify-content-center">
                    <button
                      type="button"
                      className="btn btn-md btn-dark me-2 d-flex align-items-center"
                      onClick={handlePrint}
                    >
                      <i className="ti ti-printer me-1" /> Print
                    </button>
                    <button
                      type="button"
                      className="btn btn-md btn-primary d-flex align-items-center"
                      onClick={handleDownload}
                    >
                      <i className="ti ti-download me-1" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end row*/}
        </div>
        {/* End Content */}
      </div>
      {/* Start Phone Number*/}
      <div className="modal fade" id="cancel-leave">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Cancel Reason</h5>
              <button
                type="button"
                className="btn-close custom-btn-close opacity-100"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x bg-white fs-16 text-dark" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div>
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Reason
                  </label>
                  <textarea
                    rows={4}
                    className="form-control rounded"
                    placeholder="Description"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light btn-sm me-2 fs-13 fw-medium"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm fs-13 fw-medium"
              >
                Cancel Leave
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* End Phone Number */}
      {/* ========================
			End Page Content
		========================= */}
      {/* Start Footer*/}
      <div className="p-3 bg-white border-1 border-top text-center">
        <p className="text-dark text-center">
          2026© <span className="text-info"> </span> , All Rights
          Reserved
        </p>
      </div>
      {/* End Footer*/}
    </>
  );
};

export default DoctorsPrescriptionDetails;
