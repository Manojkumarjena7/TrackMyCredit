"use client";

import { Select } from "@/components/ui/Select";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function generateYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2000; y--) {
    years.push(y);
  }
  return years;
}

interface StatementDatePickerProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function StatementDatePicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: StatementDatePickerProps) {
  const years = generateYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Filter months to prevent future selections in the current year
  const availableMonths =
    year === currentYear
      ? MONTHS.filter((m) => m.value <= currentMonth)
      : MONTHS;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        id="statement_month"
        label="Statement month"
        value={month}
        onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
      >
        {availableMonths.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Select>

      <Select
        id="statement_year"
        label="Statement year"
        value={year}
        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
