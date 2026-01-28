import React, { useState, useCallback, useRef, useEffect } from "react";
import Select, { OptionsOrGroups, ActionMeta, SingleValue } from "react-select";
import { searchMedicines, type MedicineSearchResult } from "../../../api/inventory";

// Simple debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export interface MedicineOption {
  value: string;
  label: string;
  isManual?: boolean;
  details?: MedicineSearchResult["details"];
}

interface MedicineAutocompleteProps {
  value?: string;
  onChange?: (value: string, details?: MedicineSearchResult["details"]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MedicineAutocomplete: React.FC<MedicineAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search or type medicine name...",
  className = "",
  disabled = false,
}) => {
  const [options, setOptions] = useState<MedicineOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<MedicineOption | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize selected option from value prop
  useEffect(() => {
    if (value && !selectedOption) {
      setSelectedOption({
        value: value,
        label: value,
        isManual: true,
      });
      setInputValue(value);
    }
  }, [value, selectedOption]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setOptions([]);
        setIsLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        const response = await searchMedicines(searchTerm.trim(), 20);
        
        const medicineOptions: MedicineOption[] = response.data.map((med) => ({
          value: med.value,
          label: med.label,
          isManual: false,
          details: med.details,
        }));

        // Add manual entry option if search doesn't match exactly
        const exactMatch = medicineOptions.find(
          (opt) => opt.value.toLowerCase() === searchTerm.toLowerCase()
        );
        
        if (!exactMatch && searchTerm.trim().length > 0) {
          medicineOptions.unshift({
            value: searchTerm.trim(),
            label: `Add "${searchTerm.trim()}" (Manual Entry)`,
            isManual: true,
          });
        }

        setOptions(medicineOptions);
      } catch (error: any) {
        // If error is not abort, show manual entry option
        if (error?.name !== "AbortError") {
          // eslint-disable-next-line no-console
          console.error("Error searching medicines:", error);
          // Still allow manual entry on error
          setOptions([
            {
              value: searchTerm.trim(),
              label: `Add "${searchTerm.trim()}" (Manual Entry)`,
              isManual: true,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (newValue: string, actionMeta: ActionMeta<string>) => {
    if (actionMeta.action === "input-change") {
      setInputValue(newValue);
      if (newValue.trim().length >= 2) {
        debouncedSearch(newValue);
      } else {
        setOptions([]);
      }
    }
  };

  // Handle selection change
  const handleChange = (newValue: SingleValue<MedicineOption>) => {
    const selected = newValue as MedicineOption;
    setSelectedOption(selected);
    
    if (onChange) {
      onChange(selected.value, selected.details);
    }
  };

  // Custom option component to show medicine details
  const formatOptionLabel = ({ label, isManual, details }: MedicineOption) => {
    if (isManual) {
      return (
        <div className="d-flex align-items-center">
          <i className="ti ti-plus-circle me-2 text-primary" />
          <span>{label}</span>
        </div>
      );
    }

    return (
      <div>
        <div className="fw-medium">{label}</div>
        {details && (
          <div className="text-muted small">
            {details.category && <span className="me-2">{details.category}</span>}
            {details.manufacturer && <span className="me-2">• {details.manufacturer}</span>}
            {details.quantity !== undefined && (
              <span className={`badge badge-sm ${details.status === "Available" ? "bg-success" : "bg-warning"}`}>
                Qty: {details.quantity} {details.unit}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? "#2e37a4" : "#ddd",
      boxShadow: state.isFocused ? "0 0 0 1px #2e37a4" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#2e37a4" : "#bbb",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#2e37a4"
        : state.isFocused
        ? "#f0f0f0"
        : "white",
      color: state.isSelected ? "white" : "#333",
      cursor: "pointer",
      padding: "8px 12px",
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <Select<MedicineOption>
      classNamePrefix="react-select"
      className={className}
      styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      isLoading={isLoading}
      isSearchable
      isClearable
      placeholder={placeholder}
      formatOptionLabel={formatOptionLabel}
      noOptionsMessage={({ inputValue }) =>
        inputValue && inputValue.length < 2
          ? "Type at least 2 characters to search"
          : "No medicines found. You can add manually."
      }
      loadingMessage={() => "Searching medicines..."}
      isDisabled={disabled}
      filterOption={() => true} // Disable client-side filtering, we handle it server-side
    />
  );
};

export default MedicineAutocomplete;
