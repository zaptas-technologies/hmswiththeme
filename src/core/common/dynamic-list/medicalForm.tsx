import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Medicine_Name, Frequency, Timing } from "../selectOption";
import CommonSelect from "../common-select/commonSelect";

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
}

interface MedicalFormProps {
  value?: MedicationItem[];
  onChange?: (medications: MedicationItem[]) => void;
}

const MedicalForm: React.FC<MedicalFormProps> = ({ value, onChange }) => {
  const [medications, setMedications] = useState<MedicationItem[]>(
    value || [
      {
        id: Date.now(),
        dosageMg: "",
        dosageM: "",
        instruction: "",
      },
    ]
  );

  // Sync with external value prop
  useEffect(() => {
    if (value) {
      setMedications(value);
    }
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(medications);
    }
  }, [medications, onChange]);

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
    setMedications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, instruction: value } : item
      )
    );
  };

  return (
    <div className="medication-list">
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
                    <CommonSelect
                      options={Medicine_Name}
                      className="select"
                      value={item.medicine || Medicine_Name[0]?.value}
                      onChange={(value) => {
                        setMedications((prev) =>
                          prev.map((med) =>
                            med.id === item.id ? { ...med, medicine: value } : med
                          )
                        );
                      }}
                    />
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
                          prev.map((med) =>
                            med.id === item.id ? { ...med, frequency: value } : med
                          )
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
                          prev.map((med) =>
                            med.id === item.id ? { ...med, timing: value } : med
                          )
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
