import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Diagnosis_Type } from "../selectOption";
import CommonSelect from "../common-select/commonSelect";

interface DiagnosisItem {
  id: number;
  complaintText: string;
  type?: string;
}

interface DiagnosisFormProps {
  value?: Array<{ diagnosis: string; type?: string }>;
  onChange?: (diagnoses: Array<{ diagnosis: string; type?: string }>) => void;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ value, onChange }) => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([
    {
      id: Date.now(),
      complaintText: "",
      type: Diagnosis_Type[0]?.value || "",
    },
  ]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync with external value prop
  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      const mappedDiagnoses = value.map((item, idx) => ({
        id: Date.now() + idx,
        complaintText: item.diagnosis || "",
        type: item.type || Diagnosis_Type[0]?.value || "",
      }));
      if (mappedDiagnoses.length > 0) {
        setDiagnoses(mappedDiagnoses);
      }
    }
  }, [value]);

  const handleAddAboveLast = () => {
    const newDiagnosis: DiagnosisItem = {
      id: Date.now() + Math.random(),
      complaintText: "",
      type: Diagnosis_Type[0]?.value || "",
    };

    const last = diagnoses[diagnoses.length - 1];
    const updated = [...diagnoses.slice(0, -1), newDiagnosis, last];
    setDiagnoses(updated);
    const formatted = updated
      .filter((item) => item.complaintText && item.complaintText.trim() !== "")
      .map((item) => ({
        diagnosis: item.complaintText.trim(),
        type: item.type || "",
      }));
    onChangeRef.current?.(formatted);
  };

  const handleRemove = (id: number) => {
    const updated = diagnoses.filter((item) => item.id !== id);
    setDiagnoses(updated);
    const formatted = updated
      .filter((item) => item.complaintText && item.complaintText.trim() !== "")
      .map((item) => ({
        diagnosis: item.complaintText.trim(),
        type: item.type || "",
      }));
    onChangeRef.current?.(formatted);
  };

  const handleComplaintTextChange = (id: number, value: string) => {
    const updated = diagnoses.map((item) => (item.id === id ? { ...item, complaintText: value } : item));
    setDiagnoses(updated);
    const formatted = updated
      .filter((item) => item.complaintText && item.complaintText.trim() !== "")
      .map((item) => ({
        diagnosis: item.complaintText.trim(),
        type: item.type || "",
      }));
    onChangeRef.current?.(formatted);
  };

  const handleTypeChange = (id: number, value: string) => {
    const updated = diagnoses.map((item) => (item.id === id ? { ...item, type: value } : item));
    setDiagnoses(updated);
    const formatted = updated
      .filter((item) => item.complaintText && item.complaintText.trim() !== "")
      .map((item) => ({
        diagnosis: item.complaintText.trim(),
        type: item.type || "",
      }));
    onChangeRef.current?.(formatted);
  };

  return (
    <div className="diagnosis-list">
      {diagnoses.map((item, index) => {
        const isLast = index === diagnoses.length - 1;

        return (
          <div className="row diagnosis-list-item" key={item.id}>
            <div className="col-lg-6">
              <div className="mb-3">
                {index === 0 && (
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Diagnosis Type
                  </label>
                )}
                <CommonSelect
                  options={Diagnosis_Type}
                  className="select"
                  value={item.type || Diagnosis_Type[0]?.value}
                  onChange={(val) => handleTypeChange(item.id, val)}
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mb-3">
                {index === 0 && (
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">
                    Complaint History
                  </label>
                )}
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control rounded"
                    value={item.complaintText}
                    onChange={(e) =>
                      handleComplaintTextChange(item.id, e.target.value)
                    }
                  />
                  {!isLast && (
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item.id);
                      }}
                      className="remove-diagnosis ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"
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
                      className="add-diagnosis ms-3 p-2 bg-light text-dark rounded d-flex align-items-center justify-content-center"
                    >
                      <i className="ti ti-plus fs-16" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DiagnosisForm;
