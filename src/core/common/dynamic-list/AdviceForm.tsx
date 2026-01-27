import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface AdviceFormProps {
  value?: Array<{ advice: string }>;
  onChange?: (advices: Array<{ advice: string }>) => void;
}

const AdviceForm: React.FC<AdviceFormProps> = ({ value, onChange }) => {
  const [advices, setAdvices] = useState([{ id: Date.now(), text: "" }]);

  // Sync with external value prop
  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      const mappedAdvices = value.map((item, idx) => ({
        id: Date.now() + idx,
        text: item.advice || "",
      }));
      if (mappedAdvices.length > 0) {
        setAdvices(mappedAdvices);
      }
    }
  }, [value]);

  const handleAddAdvice = () => {
    const newAdvice = { id: Date.now() + Math.random(), text: "" };
    const last = advices[advices.length - 1];
    const updated = [...advices.slice(0, -1), newAdvice, last];
    setAdvices(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.text && item.text.trim() !== "")
        .map((item) => ({ advice: item.text.trim() }));
      onChange(formatted);
    }
  };

  const handleRemoveAdvice = (id: number) => {
    const updated = advices.filter((item) => item.id !== id);
    setAdvices(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.text && item.text.trim() !== "")
        .map((item) => ({ advice: item.text.trim() }));
      onChange(formatted);
    }
  };

  const handleChangeAdvice = (id: number, newValue: string) => {
    const updated = advices.map((item) => (item.id === id ? { ...item, text: newValue } : item));
    setAdvices(updated);
    
    // Notify parent component
    if (onChange) {
      const formatted = updated
        .filter((item) => item.text && item.text.trim() !== "")
        .map((item) => ({ advice: item.text.trim() }));
      onChange(formatted);
    }
  };

  return (
    <>
      {advices.map((advice, index) => {
        const isLast = index === advices.length - 1;
        return (
          <div className="mb-3 advices-list-item" key={advice.id}>
            {index === 0 && (
              <label className="form-label mb-1 text-dark fs-14 fw-medium">
                Advice
              </label>
            )}
            <div className="input-group">
              <input
                type="text"
                className="form-control rounded"
                value={advice.text}
                onChange={(e) => handleChangeAdvice(advice.id, e.target.value)}
              />
              {!isLast && (
                <Link
                  to="#"
                  className="remove-advices ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveAdvice(advice.id);
                  }}
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
              {isLast && (
                <Link
                  to="#"
                  className="add-advices ms-3 p-2 bg-light text-dark rounded d-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddAdvice();
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

export default AdviceForm;
