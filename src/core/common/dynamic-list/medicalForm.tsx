import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Frequency, Timing } from "../selectOption";
import CommonSelect from "../common-select/commonSelect";
import MedicineAutocomplete from "../medicine-autocomplete/MedicineAutocomplete";

export interface MedicationItem {
  id: number;
  medicine?: string;
  dosage?: string;
  dosageMg?: string;
  dosageM?: string;
  frequency?: string;
  timing?: string;
  instruction?: string;
  duration?: string;
  // Inventory document id (MongoDB ObjectId as string)
  inventoryId?: string;
  // Inventory metadata (optional, for medicines from inventory)
  inventoryCode?: string;
  inventoryCategory?: string;
  inventoryManufacturer?: string;
  inventoryStock?: number;
  inventoryStatus?: "Available" | "Low Stock" | "Out of Stock" | "Expired";
  inventoryUnit?: string;
  inventoryUnitPrice?: number;
  inventoryExpiryDate?: string;
  inventoryBatchNumber?: string;
}

interface MedicalFormProps {
  value?: MedicationItem[];
  onChange?: (medications: MedicationItem[]) => void;
}

const MedicalForm: React.FC<MedicalFormProps> = ({ value, onChange }) => {
  const createEmptyRow = (): MedicationItem => ({
    id: Date.now() + Math.random(),
    medicine: "",
    dosageMg: "",
    dosageM: "",
    instruction: "",
    frequency: Frequency[0]?.value,
    timing: Timing[0]?.value,
    duration: "",
  });

  const [medications, setMedications] = useState<MedicationItem[]>(
    value && value.length > 0 ? value : [createEmptyRow()]
  );
  const [quickAddValue, setQuickAddValue] = useState<string>("");
  const onChangeRef = useRef(onChange);
  const prevValueRef = useRef(value);
  const syncingFromPropsRef = useRef(false);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync with external value prop (only if changed externally, not from our own updates)
  useEffect(() => {
    if (value && value !== prevValueRef.current) {
      syncingFromPropsRef.current = true;
      // Pro UX: if parent sends empty list, still show one editable row
      setMedications(value.length > 0 ? value : [createEmptyRow()]);
      prevValueRef.current = value;
    }
  }, [value]);

  // Notify parent when our internal medications change (but not when syncing from props)
  useEffect(() => {
    if (syncingFromPropsRef.current) {
      syncingFromPropsRef.current = false;
      return;
    }
    onChangeRef.current?.(medications);
  }, [medications]);

  const addMedicineFromSearch = useCallback(
    (medicineName: string, details?: any, inventoryCode?: string, inventoryId?: string) => {
      const name = (medicineName || "").trim();
      if (!name) return;

      const newMedication: MedicationItem = {
        ...createEmptyRow(),
        medicine: name,
        inventoryId,
        inventoryCode,
        inventoryCategory: details?.category,
        inventoryManufacturer: details?.manufacturer,
        inventoryStock: details?.quantity,
        inventoryStatus: details?.status,
        inventoryUnit: details?.unit,
        inventoryUnitPrice: details?.unitPrice,
      };

      setMedications((prev) => {
        const list = prev && prev.length > 0 ? [...prev] : [createEmptyRow()];
        const last = list[list.length - 1];
        const hasEmptyLastRow = !last?.medicine && !last?.inventoryCode;

        // Keep one empty row at the end for fast entry UX
        const tail = hasEmptyLastRow ? last : createEmptyRow();
        const body = hasEmptyLastRow ? list.slice(0, -1) : list;

        return [...body, newMedication, tail];
      });
    },
    // createEmptyRow is stable enough for this use-case
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Add a new medication row above last
  const handleAddAboveLast = () => {
    const newMedication: MedicationItem = {
      id: Date.now() + Math.random(),
      dosageMg: "",
      dosageM: "",
      instruction: "",
    };

    setMedications((prev) => {
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), newMedication, last];
    });
  };

  // Remove medication row by id
  const handleRemove = (id: number) => {
    setMedications((prev) => prev.filter((item) => item.id !== id));
  };

  // Handlers for controlled inputs
  const handleDosageMgChange = (id: number, value: string) => {
    setMedications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const dosage = value ? `${value}mg` : (item.dosageM ? `${item.dosageM}m` : "");
          return { ...item, dosageMg: value, dosage };
        }
        return item;
      })
    );
  };

  const handleDosageMChange = (id: number, value: string) => {
    setMedications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const dosage = value ? `${value}m` : (item.dosageMg ? `${item.dosageMg}mg` : "");
          return { ...item, dosageM: value, dosage };
        }
        return item;
      })
    );
  };

  const handleInstructionChange = (id: number, value: string) => {
    setMedications((prev) => prev.map((item) => (item.id === id ? { ...item, instruction: value } : item)));
  };

  return (
    <div className="medication-list">
      {/* Pro UX: global search to add medicines quickly */}
      <div className="medication-searchbar">
        <div className="medication-searchbar__header">
          <div>
            <label className="form-label mb-1 text-dark fs-14 fw-medium">
              Search medicine (Inventory)
            </label>
            <div className="text-muted fs-12">
              Select an item to auto-fill code, stock and price.
            </div>
          </div>
        </div>
        <div className="medication-searchbar__control">
          <MedicineAutocomplete
            value={quickAddValue}
            onChange={(value, details, inventoryCode, inventoryId) => {
              addMedicineFromSearch(value, details, inventoryCode, inventoryId);
              setQuickAddValue("");
            }}
            placeholder="Type medicine name…"
            className="medication-searchbar__select"
            showStockWarnings={true}
          />
        </div>
      </div>

      {medications.map((item, index) => {
        const isLast = index === medications.length - 1;
        return (
          <div className="row medication-list-item" key={item.id}>
            <div className="col-lg-11">
              <div className="row">
                <div className="col-lg-2">
                  <div className="mb-3">
                    {/* Label only on first row */}
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Medicine Name
                      </label>
                    )}
                    {/* Medicine name is now a plain input (no search dropdown). 
                        Use the top Inventory search bar to add medicines with details. */}
                    <input
                      type="text"
                      className="form-control"
                      value={item.medicine || ""}
                      placeholder="Enter medicine name"
                      onChange={(e) => {
                        const val = e.target.value;
                        setMedications((prev) =>
                          prev.map((med) =>
                            med.id === item.id
                              ? {
                                  ...med,
                                  medicine: val,
                                  // If user edits manually, clear inventory link fields
                                  ...(val !== (item.medicine || "")
                                    ? {
                                        inventoryId: undefined,
                                        inventoryCode: undefined,
                                        inventoryCategory: undefined,
                                        inventoryManufacturer: undefined,
                                        inventoryStock: undefined,
                                        inventoryStatus: undefined,
                                        inventoryUnit: undefined,
                                        inventoryUnitPrice: undefined,
                                        inventoryExpiryDate: undefined,
                                        inventoryBatchNumber: undefined,
                                      }
                                    : {}),
                                }
                              : med
                          )
                        );
                      }}
                    />
                    {/* Display inventory metadata if available */}
                    {(item.inventoryCode || item.inventoryExpiryDate || item.inventoryBatchNumber) && (
                      <div className="mt-1 medicine-meta">
                        <small className="text-muted d-flex align-items-center gap-2 flex-wrap medicine-meta__chips">
                          {item.inventoryCode && (
                            <span>
                              <i className="ti ti-barcode me-1" />
                              Code: {item.inventoryCode}
                            </span>
                          )}
                          {item.inventoryBatchNumber && (
                            <span>
                              <i className="ti ti-tag me-1" />
                              Batch: {item.inventoryBatchNumber}
                            </span>
                          )}
                          {item.inventoryCategory && (
                            <span>
                              <i className="ti ti-category me-1" />
                              {item.inventoryCategory}
                            </span>
                          )}
                          {item.inventoryManufacturer && (
                            <span>
                              <i className="ti ti-building me-1" />
                              {item.inventoryManufacturer}
                            </span>
                          )}
                          {item.inventoryExpiryDate && (
                            <span className="medicine-meta__expiry">
                              <i className="ti ti-calendar-event me-1" />
                              Exp: {item.inventoryExpiryDate}
                            </span>
                          )}
                          {item.inventoryStatus && (
                            <span
                              className={`badge badge-sm ${
                                item.inventoryStatus === "Out of Stock"
                                  ? "bg-danger"
                                  : item.inventoryStatus === "Low Stock"
                                  ? "bg-warning"
                                  : "bg-success"
                              }`}
                            >
                              {item.inventoryStatus === "Out of Stock"
                                ? "Out of Stock"
                                : item.inventoryStatus === "Low Stock"
                                ? "Low Stock"
                                : "In Stock"}
                              {item.inventoryStock !== undefined && item.inventoryStock !== null && (
                                <span className="ms-1">
                                  ({item.inventoryStock} {item.inventoryUnit || "units"})
                                </span>
                              )}
                            </span>
                          )}
                          {item.inventoryUnitPrice && item.inventoryUnitPrice > 0 && (
                            <span>
                              <i className="ti ti-currency-rupee me-1" />
                              ₹{item.inventoryUnitPrice.toFixed(2)}/{item.inventoryUnit || "unit"}
                            </span>
                          )}
                        </small>
                        {/* Show warning for out of stock or low stock */}
                        {item.inventoryStatus === "Out of Stock" && (
                          <div className="alert alert-danger alert-sm mt-1 mb-0 py-1 px-2">
                            <i className="ti ti-alert-circle me-1" />
                            <small>This medicine is currently out of stock in inventory.</small>
                          </div>
                        )}
                        {item.inventoryStatus === "Low Stock" && (
                          <div className="alert alert-warning alert-sm mt-1 mb-0 py-1 px-2">
                            <i className="ti ti-alert-triangle me-1" />
                            <small>
                              Low stock warning: Only {item.inventoryStock} {item.inventoryUnit || "units"} available.
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-lg-2">
                  <div className="mb-3">
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Dosage
                      </label>
                    )}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={item.dosageMg}
                        onChange={(e) =>
                          handleDosageMgChange(item.id, e.target.value)
                        }
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        mg
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-2">
                  <div className="mb-3">
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Dosage
                      </label>
                    )}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={item.dosageM}
                        onChange={(e) =>
                          handleDosageMChange(item.id, e.target.value)
                        }
                      />
                      <span className="input-group-text bg-transparent text-dark fs-14">
                        m
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-2">
                  <div className="mb-3">
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Frequency
                      </label>
                    )}
                    <CommonSelect
                      options={Frequency}
                      className="select"
                      value={item.frequency || Frequency[0]?.value}
                      onChange={(value) => {
                        setMedications((prev) =>
                          prev.map((med) => (med.id === item.id ? { ...med, frequency: value } : med))
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="col-lg-2">
                  <div className="mb-3">
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Timing
                      </label>
                    )}
                    <CommonSelect
                      options={Timing}
                      className="select"
                      value={item.timing || Timing[0]?.value}
                      onChange={(value) => {
                        setMedications((prev) =>
                          prev.map((med) => (med.id === item.id ? { ...med, timing: value } : med))
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="col-lg-2">
                  <div className="mb-3">
                    {index === 0 && (
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Instruction
                      </label>
                    )}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={item.instruction}
                        onChange={(e) =>
                          handleInstructionChange(item.id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-1 px-xxl-3 d-flex align-items-center">
              {!isLast && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id);
                  }}
                  className="remove-medication ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
              {isLast && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddAboveLast();
                  }}
                  className="add-medication ms-3 p-2 mt-1 bg-light text-dark rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-plus fs-16" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MedicalForm;
