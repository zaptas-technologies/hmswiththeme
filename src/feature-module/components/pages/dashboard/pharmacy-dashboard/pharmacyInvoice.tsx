import { Link, useSearchParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { fetchPrescriptionById, type Prescription } from "../../../../../api/prescriptions";
import { fetchPrescriptionPriceBreakdown } from "../../../../../api/pharmacies";

const PharmacyInvoice = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{ lineItems: Array<{ medicine: string; dosage?: string; unitPrice: number; quantity: number; subtotal: number }>; total: number } | null>(null);

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
        const [presc, breakdown] = await Promise.all([
          fetchPrescriptionById(id),
          fetchPrescriptionPriceBreakdown(id).catch(() => null),
        ]);
        setPrescription(presc);
        setPriceBreakdown(breakdown);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load prescription");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const medicines = useMemo(() => {
    if (priceBreakdown?.lineItems?.length) {
      return priceBreakdown.lineItems.map((line, idx) => ({
        medicine: line.medicine,
        dosage: line.dosage,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      }));
    }
    if (!prescription) return [];
    const meds = (prescription as any).Medications;
    if (Array.isArray(meds) && meds.length > 0) {
      return meds.map((m: any) => ({
        medicine: m?.medicine || "N/A",
        dosage: m?.dosage,
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      }));
    }
    if (prescription.Medicine) {
      return [
        {
          medicine: prescription.Medicine,
          dosage: prescription.Dosage,
          quantity: 1,
          unitPrice: 0,
          subtotal: 0,
        },
      ];
    }
    return [];
  }, [prescription, priceBreakdown]);

  const totalAmount = useMemo(() => {
    const amount = (prescription as any)?.Amount;
    if (typeof amount === "number" && amount >= 0) return amount;
    if (typeof amount === "string" && amount.trim() !== "") return parseFloat(amount) || 0;
    if (priceBreakdown?.total != null) return priceBreakdown.total;
    return medicines.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  }, [prescription, priceBreakdown, medicines]);

  const invoiceDate = useMemo(() => {
    const d = (prescription as any)?.updatedAt || (prescription as any)?.createdAt || "";
    if (!d) return "N/A";
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format("DD MMM YYYY, hh:mm A") : String(d);
  }, [prescription]);

  const prescribedOnLabel = useMemo(() => {
    const d = (prescription?.Prescribed_On || prescription?.Date || "") as string;
    if (!d) return "N/A";
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format("DD MMM YYYY") : d;
  }, [prescription?.Prescribed_On, prescription?.Date]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  const handlePrint = () => window.print();
  const handleDownload = () => window.print();

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="mb-0">Loading invoice…</p>
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
            <p className="text-danger fw-semibold mb-3">{error || "Unable to load invoice."}</p>
            <Link to={all_routes.pharmacyDashboard} className="btn btn-primary">
              Back to Pharmacy Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoiceNo = prescription.Prescription_ID || (prescription as any).PrescriptionId || prescription._id || "N/A";
  const hasPrices = medicines.some((m) => (m.unitPrice ?? 0) > 0);

  return (
    <>
      <style>{`
        @media print {
          .navbar-header, .navbar, .header, .sidebar, .sidebar-wrapper, .sidebar-logo,
          .sidebar-menu, .sidebar-inner, .sidebar-footer, .topbar, .topbar-menu,
          .page-header, .page-title, nav, header, aside, .btn,
          .d-flex.align-items-sm-center.flex-sm-row.flex-column.mb-4.invoice-nav,
          .modal, footer, .p-3.bg-white.border-1.border-top,
          .invoice-actions {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body { margin: 0 !important; padding: 0 !important; }
          .page-wrapper {
            margin: 0 !important; padding: 0 !important;
            width: 100% !important; max-width: 100% !important;
            position: relative !important; top: 0 !important; left: 0 !important;
          }
          .content {
            margin: 0 !important; padding: 20px !important;
            width: 100% !important; max-width: 100% !important;
          }
          .card {
            width: 100% !important; max-width: 100% !important;
            box-shadow: none !important; border: 1px solid #ddd !important;
            margin: 0 !important; page-break-inside: avoid;
          }
          .card-body { padding: 20px !important; }
          .table-responsive { overflow: visible !important; page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          .card-body > div { page-break-inside: avoid; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="d-flex align-items-sm-center flex-sm-row flex-column mb-4 invoice-nav">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.pharmacyDashboard} className="me-1">
                      <i className="ti ti-chevron-left" /> Pharmacy Dashboard
                    </Link>
                  </h6>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <ImageWithBasePath src="assets/img/logo.svg" alt="" />
                    <div className="text-end">
                      <span className="badge bg-primary fs-13 fw-medium py-2 px-3">INVOICE</span>
                      <p className="mb-0 mt-1 small text-muted">#{invoiceNo}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 flex-wrap gap-2">
                    <div>
                      <h6 className="text-dark fw-semibold mb-1">
                        {(prescription as any)?.Hospital_Name || "Pharmacy"}
                      </h6>
                      <p className="mb-1 text-muted small">Medicine / Payment Invoice</p>
                      <p className="mb-0 small">Prescription: {invoiceNo}</p>
                    </div>
                    <div className="text-lg-end">
                      <p className="text-dark mb-1">
                        Invoice Date : <span className="text-body">{invoiceDate}</span>
                      </p>
                      <p className="text-dark mb-1">
                        Prescribed on : <span className="text-body">{prescribedOnLabel}</span>
                      </p>
                      <p className="text-dark mb-0">
                        Doctor : <span className="text-body">{prescription.Doctor || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <h6 className="mb-2 fs-14 fw-medium">Patient Details</h6>
                    <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <h6 className="m-0 fw-semibold fs-16">{prescription.Patient || "N/A"}</h6>
                      <span className="text-muted small">Patient ID: {(prescription as any).patientId || "N/A"}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h6 className="mb-3 fs-16 fw-semibold">Medicine &amp; Payment Details</h6>
                    <div className="table-responsive border bg-white">
                      <table className="table table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-dark">#</th>
                            <th className="text-dark">Medicine Name</th>
                            <th className="text-dark">Dosage</th>
                            <th className="text-dark text-center">Qty</th>
                            {hasPrices && <th className="text-dark text-end">Unit Price</th>}
                            {hasPrices && <th className="text-dark text-end">Amount</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.length === 0 ? (
                            <tr>
                              <td colSpan={hasPrices ? 6 : 4} className="text-center text-muted py-3">
                                No items.
                              </td>
                            </tr>
                          ) : (
                            medicines.map((m, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{m.medicine}</td>
                                <td>{m.dosage || "—"}</td>
                                <td className="text-center">{m.quantity}</td>
                                {hasPrices && <td className="text-end">{formatCurrency(m.unitPrice ?? 0)}</td>}
                                {hasPrices && <td className="text-end fw-medium">{formatCurrency(m.subtotal ?? 0)}</td>}
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan={hasPrices ? 4 : 3} className="text-end fw-bold">
                              Total Amount Paid
                            </td>
                            {hasPrices ? <td className="text-end" /> : null}
                            <td className="text-end fw-bold fs-16">{formatCurrency(totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <div className="border-top pt-3 small text-muted">
                    <p className="mb-1">This is a computer-generated invoice for medicine dispensed against the above prescription.</p>
                    <p className="mb-0">Thank you for your visit.</p>
                  </div>
                  <div className="text-center d-flex align-items-center justify-content-center invoice-actions mt-4">
                    <button type="button" className="btn btn-md btn-dark me-2 d-flex align-items-center" onClick={handlePrint}>
                      <i className="ti ti-printer me-1" /> Print
                    </button>
                    <button type="button" className="btn btn-md btn-primary d-flex align-items-center" onClick={handleDownload}>
                      <i className="ti ti-download me-1" /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PharmacyInvoice;
