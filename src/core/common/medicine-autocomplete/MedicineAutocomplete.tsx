import React, { useState, useCallback, useRef, useEffect } from "react";
import Select from "react-select";
import { searchMedicines, type MedicineSearchResult } from "../../../api/inventory";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

// Types for react-select v5 (not exported directly)
type InputActionMeta = {
  action: "input-change" | "set-value" | "input-blur" | "menu-close";
};

type SingleValue<Option> = Option | null;

// Simple debounce function (no NodeJS types needed)
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
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
  inventoryCode?: string; // Store inventory item code for reference
  inventoryId?: string; // Store inventory _id for DB references
}

interface MedicineAutocompleteProps {
  value?: string;
  onChange?: (
    value: string,
    details?: MedicineSearchResult["details"],
    inventoryCode?: string,
    inventoryId?: string
  ) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showStockWarnings?: boolean;
}

const MedicineAutocomplete: React.FC<MedicineAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search or type medicine name...",
  className = "",
  disabled = false,
  showStockWarnings = true,
}) => {
  const { user } = useAuth();
  const [options, setOptions] = useState<MedicineOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<MedicineOption | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize selected option from value prop
  useEffect(() => {
    if (value) {
      setInputValue(value);
      setSelectedOption((prev) =>
        prev?.value === value
          ? prev
          : {
              value,
              label: value,
              isManual: true,
            }
      );
      return;
    }

    // Clear selection if value is cleared
    setInputValue("");
    setSelectedOption(null);
  }, [value]); // Removed selectedOption from dependencies to prevent loop

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 1) {
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
        const response = await searchMedicines(searchTerm.trim(), 20, user?.hospitalId);
        
        const medicineOptions: MedicineOption[] = response.data.map((med) => ({
          value: med.value,
          label: med.label,
          isManual: false,
          details: med.details,
          inventoryCode: med.code || undefined,
          inventoryId: med.inventoryId || med.details?.inventoryId || undefined,
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
  const handleInputChange = (newValue: string, actionMeta: InputActionMeta | undefined) => {
    if (actionMeta?.action === "input-change") {
      setInputValue(newValue);
      if (newValue.trim().length >= 1) {
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
      onChange(selected.value, selected.details, selected.inventoryCode, selected.inventoryId);
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

    const stockStatus = details?.status || "Available";
    const quantity = details?.quantity ?? 0;
    const isLowStock = stockStatus === "Low Stock";
    const isOutOfStock = stockStatus === "Out of Stock";
    const expiry = details?.expiryDate ? dayjs(details.expiryDate) : null;
    const expiryLabel = expiry?.isValid() ? expiry.format("DD MMM YYYY") : "";

    return (
      <div className="w-100">
        <div className="d-flex align-items-center justify-content-between">
          <div className="fw-medium">{label}</div>
          {details && showStockWarnings && (
            <span
              className={`badge badge-sm ms-2 ${
                isOutOfStock
                  ? "bg-danger"
                  : isLowStock
                  ? "bg-warning"
                  : "bg-success"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : isLowStock
                ? "Low Stock"
                : "Available"}
            </span>
          )}
        </div>
        {details && (
          <div className="text-muted small mt-1">
            {details.code && (
              <span className="me-2">
                <i className="ti ti-barcode me-1" />
                {details.code}
              </span>
            )}
            {details.batchNumber && (
              <span className="me-2">
                <i className="ti ti-tag me-1" />
                Batch: {details.batchNumber}
              </span>
            )}
            {details.category && (
              <span className="me-2">
                <i className="ti ti-category me-1" />
                {details.category}
              </span>
            )}
            {details.manufacturer && (
              <span className="me-2">
                <i className="ti ti-building me-1" />
                {details.manufacturer}
              </span>
            )}
            {expiryLabel && (
              <span className="me-2">
                <i className="ti ti-calendar-event me-1" />
                Exp: {expiryLabel}
              </span>
            )}
            {quantity !== undefined && quantity !== null && (
              <span className="d-block mt-1">
                <strong>Stock:</strong> {quantity} {details.unit || "units"}
                {details.unitPrice && (
                  <span className="ms-2">
                    <strong>Price:</strong> ₹{details.unitPrice.toFixed(2)}/{details.unit || "unit"}
                  </span>
                )}
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
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 999999,
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
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      onBlur={() => {
        // Manual add UX: if user typed something but didn't select, treat it as manual entry
        const typed = inputValue.trim();
        if (!typed) return;
        if (selectedOption?.value === typed) return;

        const manual: MedicineOption = { value: typed, label: typed, isManual: true };
        setSelectedOption(manual);
        onChange?.(typed, undefined, undefined, undefined);
      }}
      noOptionsMessage={({ inputValue }) =>
        inputValue && inputValue.length < 1
          ? "Type to search inventory"
          : "No medicines found. Select the manual entry to add."
      }
      loadingMessage={() => "Searching inventory..."}
      isDisabled={disabled}
      filterOption={() => true} // Disable client-side filtering, we handle it server-side
    />
  );
};

export default MedicineAutocomplete;
