import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface ComplaintItem {
  id: number;
  value: string;
}

interface ComplaintFormProps {
  value?: Array<{ complaint: string; duration?: string }>;
  onChange?: (complaints: Array<{ complaint: string; duration?: string }>) => void;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ value, onChange }) => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([
    { id: Date.now(), value: '' },
  ]);

  // Sync with external value prop
  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      const mappedComplaints = value.map((item, idx) => ({
        id: Date.now() + idx,
        value: item.complaint || '',
      }));
      if (mappedComplaints.length > 0) {
        setComplaints(mappedComplaints);
      }
    }
  }, [value]);


  const handleChange = (id: number, value: string) => {
    setComplaints((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, value } : item
      );
      // Notify parent component
      if (onChange) {
        const formatted = updated
          .filter((item) => item.value && item.value.trim() !== "")
          .map((item) => ({ complaint: item.value.trim() }));
        onChange(formatted);
      }
      return updated;
    });
  };

  const handleAddAboveLast = () => {
    const newComplaint: ComplaintItem = {
      id: Date.now() + Math.random(),
      value: "",
    };
    setComplaints((prev) => {
      const last = prev[prev.length - 1];
      const updated = [...prev.slice(0, -1), newComplaint, last];
      // Notify parent component
      if (onChange) {
        const formatted = updated
          .filter((item) => item.value && item.value.trim() !== "")
          .map((item) => ({ complaint: item.value.trim() }));
        onChange(formatted);
      }
      return updated;
    });
  };

  const handleRemove = (id: number) => {
    setComplaints((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      // Notify parent component
      if (onChange) {
        const formatted = updated
          .filter((item) => item.value && item.value.trim() !== "")
          .map((item) => ({ complaint: item.value.trim() }));
        onChange(formatted);
      }
      return updated;
    });
  };

  return (
    <div className="complaint-list">
      {complaints.map((complaint, index) => {
        const isLast = index === complaints.length - 1;

        return (
          <div className="mb-3 complaint-list-item" key={complaint.id}>
            {index === 0 && (
              <label className="form-label mb-1 text-dark fs-14 fw-medium">
                Complaint
              </label>
            )}
            <div className="input-group">
              <input
                type="text"
                className="form-control rounded"
                value={complaint.value}
                onChange={(e) =>
                  handleChange(complaint.id, e.target.value)
                }
              />

              {/* Trash button only if not the last item */}
              {!isLast && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(complaint.id);
                  }}
                  className="remove-complaint ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}

              {/* Plus button only for the last item */}
              {isLast && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddAboveLast();
                  }}
                  className="add-complaint ms-3 p-2 bg-light text-dark rounded d-flex align-items-center justify-content-center"
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

export default ComplaintForm;
