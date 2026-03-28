import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/treatmentPlanUtils";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "e.g., 50000",
  className = "",
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const numValue = e.target.value.replace(/[^0-9]/g, "");
    onChange(numValue);
  };

  // Display value: show formatted currency if there's a value, otherwise show placeholder
  const displayValue = value ? formatCurrency(value).replace("$", "").trim() : "";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 font-semibold pointer-events-none">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-7 bg-gray-50 ${className}`}
      />
    </div>
  );
}
