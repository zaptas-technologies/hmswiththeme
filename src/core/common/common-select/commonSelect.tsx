import React, { useEffect, useState } from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option | string;
  value?: Option | string;
  onChange?: (value: string) => void;
  className?: string;
  styles?: any; 
}

const CommonSelect: React.FC<SelectProps> = ({ options, defaultValue, value, onChange, className }) => {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(
    typeof defaultValue === "string" 
      ? options.find(opt => opt.value === defaultValue) 
      : defaultValue
  );

  const customStyles = {
    option: (base: any, state: any) => ({
      ...base,
      color: "#6C7688",
      backgroundColor: state.isSelected ? "#ddd" : "white",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: state.isFocused ? "#2e37a4" : "white",
        color: state.isFocused ? "#fff" : "#2e37a4",
      },
    }),
  };

  const handleChange = (option: Option | null) => {
    const newOption = option || undefined;
    setSelectedOption(newOption);
    if (onChange && newOption) {
      onChange(newOption.value);
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      const option = typeof value === "string" 
        ? options.find(opt => opt.value === value) 
        : value;
      setSelectedOption(option);
    } else if (defaultValue !== undefined) {
      const option = typeof defaultValue === "string" 
        ? options.find(opt => opt.value === defaultValue) 
        : defaultValue;
      setSelectedOption(option);
    }
  }, [value, defaultValue, options]);
  
  return (
    <Select
      classNamePrefix="react-select"
      className={className}
      styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder="Select"
    />
  );
};

export default CommonSelect;
