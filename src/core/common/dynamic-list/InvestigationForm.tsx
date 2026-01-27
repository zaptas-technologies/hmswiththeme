import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface InvestigationListProps {
  value?: Array<{ investigation: string; notes?: string }>;
  onChange?: (investigations: Array<{ investigation: string; notes?: string }>) => void;
}

const InvestigationList: React.FC<InvestigationListProps> = ({ value, onChange }) => {
  const [investigations, setInvestigations] = useState([
    { id: Date.now(), value: "" },
  ]);

  // Sync with external value prop
  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      const mappedInvestigations = value.map((item, idx) => ({
        id: Date.now() + idx,
        value: item.investigation || "",
      }));
      if (mappedInvestigations.length > 0) {
        setInvestigations(mappedInvestigations);
      }
    }
  }, [value]);

  const handleAddInvestigation = () => {
    const newItem = { id: Date.now() + Math.random(), value: "" };
    const last = investigations[investigations.length - 1];
    const updated = [...investigations.slice(0, -1), newItem, last];
    setInvestigations(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.value && item.value.trim() !== "")
        .map((item) => ({
          investigation: item.value.trim(),
          notes: "",
        }));
      onChange(formatted);
    }
  };

  const handleRemoveInvestigation = (id: number) => {
    const updated = investigations.filter((item) => item.id !== id);
    setInvestigations(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.value && item.value.trim() !== "")
        .map((item) => ({
          investigation: item.value.trim(),
          notes: "",
        }));
      onChange(formatted);
    }
  };

  const handleChangeInvestigation = (id: number, newValue: string) => {
    const updated = investigations.map((item) => (item.id === id ? { ...item, value: newValue } : item));
    setInvestigations(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.value && item.value.trim() !== "")
        .map((item) => ({
          investigation: item.value.trim(),
          notes: "",
        }));
      onChange(formatted);
    }
  };

  return (
    <>
      {investigations.map((item, index) => {
        const isLast = index === investigations.length - 1;
        return (
          <div className="mb-3 invest-list-item" key={item.id}>
            {index === 0 && (
              <label className="form-label mb-1 text-dark fs-14 fw-medium">
                Investigation &amp; Procedure
              </label>
            )}
            <div className="input-group">
              <input
                type="text"
                className="form-control rounded"
                value={item.value}
                onChange={(e) =>
                  handleChangeInvestigation(item.id, e.target.value)
                }
              />
              {!isLast && (
                <Link
                  to="#"
                  className="remove-invest ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveInvestigation(item.id);
                  }}
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
              {isLast && (
                <Link
                  to="#"
                  className="add-invest ms-3 p-2 bg-light text-dark rounded d-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddInvestigation();
                  }}
                >
                  <i className="ti ti-plus fs-16" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default InvestigationList;
