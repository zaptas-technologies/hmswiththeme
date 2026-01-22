import { DatePicker, Select } from "antd";
import { Link } from "react-router";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import {
  createDoctorLeave,
  updateDoctorLeave,
  type DoctorLeave,
} from "../../../../../../api/doctorLeaves";
import { Doctor } from "../../../../../../core/common/selectOption";

interface ModalsProps {
  selectedLeave?: DoctorLeave | null;
  onSuccess?: () => void;
  onDelete?: () => void;
}

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Compensatory Leave",
  "Emergency Leave",
  "Bereavement Leave",
  "Study/Exam Leave",
  "Paid Leave",
  "Unpaid Leave",
  "Vacation",
];

const STATUS_OPTIONS = [
  { label: "Applied", value: "Applied" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const Modals = ({ selectedLeave = null, onSuccess, onDelete }: ModalsProps) => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const [formData, setFormData] = useState({
    Doctor: "",
    Leave_Type: "",
    From_Date: null as Dayjs | null,
    To_Date: null as Dayjs | null,
    Status: "Applied" as "Applied" | "Approved" | "Rejected",
    Reason: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLeave) {
      // Parse date from Date string (format: "15 Apr 2026- 15 Apr 2025")
      const dateStr = selectedLeave.Date || "";
      const dateParts = dateStr.split(" - ");
      const fromDateStr = dateParts[0] || "";
      const toDateStr = dateParts[1] || dateParts[0] || "";

      setFormData({
        Doctor: selectedLeave.Doctor || "",
        Leave_Type: selectedLeave.Leave_Type || "",
        From_Date: fromDateStr ? dayjs(fromDateStr, "DD MMM YYYY") : null,
        To_Date: toDateStr ? dayjs(toDateStr, "DD MMM YYYY") : null,
        Status: (selectedLeave.Status as "Applied" | "Approved" | "Rejected") || "Applied",
        Reason: selectedLeave.Reason || "",
      });
    } else {
      setFormData({
        Doctor: "",
        Leave_Type: "",
        From_Date: null,
        To_Date: null,
        Status: "Applied",
        Reason: "",
      });
    }
  }, [selectedLeave]);

  const calculateDays = (from: Dayjs | null, to: Dayjs | null): number => {
    if (!from || !to) return 0;
    return to.diff(from, "day") + 1;
  };

  const formatDateString = (from: Dayjs | null, to: Dayjs | null): string => {
    if (!from || !to) return "";
    const fromStr = from.format("DD MMM YYYY");
    const toStr = to.format("DD MMM YYYY");
    return fromStr === toStr ? `${fromStr} - ${toStr}` : `${fromStr} - ${toStr}`;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Doctor || !formData.Leave_Type || !formData.From_Date || !formData.To_Date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const days = calculateDays(formData.From_Date, formData.To_Date);
      const dayString = days === 1 ? "01 Day" : `${days.toString().padStart(2, "0")} Days`;

      await createDoctorLeave({
        Doctor: formData.Doctor,
        Leave_Type: formData.Leave_Type,
        From_Date: formData.From_Date.toISOString(),
        To_Date: formData.To_Date.toISOString(),
        Date: formatDateString(formData.From_Date, formData.To_Date),
        Day: dayString,
        No_Of_Days: days,
        Applied_On: dayjs().format("DD MMM YYYY"),
        Applied_On_Date: new Date().toISOString(),
        Status: formData.Status,
        Reason: formData.Reason,
      });

      // Close modal
      const modal = document.getElementById("add-leave");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }

      // Reset form
      setFormData({
        Doctor: "",
        Leave_Type: "",
        From_Date: null,
        To_Date: null,
        Status: "Applied",
        Reason: "",
      });

      onSuccess?.();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to create doctor leave";
      alert(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error creating doctor leave:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    if (!formData.Doctor || !formData.Leave_Type || !formData.From_Date || !formData.To_Date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const leaveId = selectedLeave._id || selectedLeave.id;
      if (!leaveId) {
        alert("Leave ID not found");
        return;
      }

      const days = calculateDays(formData.From_Date, formData.To_Date);
      const dayString = days === 1 ? "01 Day" : `${days.toString().padStart(2, "0")} Days`;

      const { id, _id, ...updateData } = {
        Doctor: formData.Doctor,
        Leave_Type: formData.Leave_Type,
        From_Date: formData.From_Date.toISOString(),
        To_Date: formData.To_Date.toISOString(),
        Date: formatDateString(formData.From_Date, formData.To_Date),
        Day: dayString,
        No_Of_Days: days,
        Status: formData.Status,
        Reason: formData.Reason,
      } as any;

      await updateDoctorLeave(leaveId, updateData);

      // Close modal
      const modal = document.getElementById("edit-leave");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }

      onSuccess?.();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to update doctor leave";
      alert(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error updating doctor leave:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
      // Close modal
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    }
  };

  const days = calculateDays(formData.From_Date, formData.To_Date);
  const dayString = days > 0 ? (days === 1 ? "01 Day" : `${days.toString().padStart(2, "0")} Days`) : "";

  return (
    <>
      {/* Start Add leave */}
      <div className="modal fade" id="add-leave">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Add New Leave</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Doctor<span className="text-danger">*</span>
                      </label>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Please select doctor"
                        value={formData.Doctor || undefined}
                        onChange={(value) => setFormData({ ...formData, Doctor: value })}
                        options={Doctor}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Leave Type<span className="text-danger">*</span>
                      </label>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Please select leave type"
                        value={formData.Leave_Type || undefined}
                        onChange={(value) => setFormData({ ...formData, Leave_Type: value })}
                        options={LEAVE_TYPES.map((type) => ({ label: type, value: type }))}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        From Date<span className="text-danger">*</span>
                      </label>
                      <div className="input-group position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={formData.From_Date}
                          onChange={(date) => setFormData({ ...formData, From_Date: date })}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-body" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        To Date<span className="text-danger">*</span>
                      </label>
                      <div className="input-group position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={formData.To_Date}
                          onChange={(date) => setFormData({ ...formData, To_Date: date })}
                          disabledDate={(current) =>
                            formData.From_Date ? current < formData.From_Date : false
                          }
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-body" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        No of Days
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={dayString}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <div className="row p-2 bg-light rounded align-items-center flex-wrap">
                        <div className="col-lg-6">
                          <label className="form-label mb-1 text-body fs-14 fw-medium">
                            {formData.From_Date && formData.To_Date
                              ? formatDateString(formData.From_Date, formData.To_Date)
                              : "dd/mm/yyyy"}
                          </label>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label mb-1 text-dark fs-14 fw-medium">
                            Status<span className="text-danger">*</span>
                          </label>
                          <Select
                            style={{ width: "100%" }}
                            placeholder="Please select status"
                            value={formData.Status}
                            onChange={(value) =>
                              setFormData({ ...formData, Status: value as any })
                            }
                            options={STATUS_OPTIONS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Reason</label>
                      <textarea
                        rows={4}
                        className="form-control rounded"
                        placeholder="Description"
                        value={formData.Reason}
                        onChange={(e) => setFormData({ ...formData, Reason: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light btn-sm me-2 fs-13 fw-medium"
                  data-bs-dismiss="modal"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm fs-13 fw-medium"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add New Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* End Add New leave  */}

      {/* Start Edit leave */}
      <div className="modal fade" id="edit-leave">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Edit Leave</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Doctor<span className="text-danger">*</span>
                      </label>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Please select doctor"
                        value={formData.Doctor || undefined}
                        onChange={(value) => setFormData({ ...formData, Doctor: value })}
                        options={Doctor}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Leave Type<span className="text-danger">*</span>
                      </label>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Please select leave type"
                        value={formData.Leave_Type || undefined}
                        onChange={(value) => setFormData({ ...formData, Leave_Type: value })}
                        options={LEAVE_TYPES.map((type) => ({ label: type, value: type }))}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        From Date<span className="text-danger">*</span>
                      </label>
                      <div className="input-group position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={formData.From_Date}
                          onChange={(date) => setFormData({ ...formData, From_Date: date })}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-body" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        To Date<span className="text-danger">*</span>
                      </label>
                      <div className="input-group position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={formData.To_Date}
                          onChange={(date) => setFormData({ ...formData, To_Date: date })}
                          disabledDate={(current) =>
                            formData.From_Date ? current < formData.From_Date : false
                          }
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-body" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        No of Days
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={dayString}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <div className="row p-2 bg-light rounded align-items-center flex-wrap">
                        <div className="col-lg-6">
                          <label className="form-label mb-1 text-body fs-14 fw-medium">
                            {formData.From_Date && formData.To_Date
                              ? formatDateString(formData.From_Date, formData.To_Date)
                              : "dd/mm/yyyy"}
                          </label>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label mb-1 text-dark fs-14 fw-medium">
                            Status<span className="text-danger">*</span>
                          </label>
                          <Select
                            style={{ width: "100%" }}
                            placeholder="Please select status"
                            value={formData.Status}
                            onChange={(value) =>
                              setFormData({ ...formData, Status: value as any })
                            }
                            options={STATUS_OPTIONS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Reason</label>
                      <textarea
                        rows={4}
                        className="form-control rounded"
                        placeholder="Description"
                        value={formData.Reason}
                        onChange={(e) => setFormData({ ...formData, Reason: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light btn-sm me-2 fs-13 fw-medium"
                  data-bs-dismiss="modal"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm fs-13 fw-medium"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Edit Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* End Edit leave  */}

      {/* Start Delete Modal  */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-0"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-0"
              />
              <div className="mb-3 position-relative z-1">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1 position-relative z-1">Delete Confirmation</h5>
              <p className="mb-3 position-relative z-1">Are you sure want to delete?</p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Delete Modal  */}
    </>
  );
};

export default Modals;
