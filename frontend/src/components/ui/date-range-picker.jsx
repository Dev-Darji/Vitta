import * as React from "react"
import { addDays, format, startOfToday, startOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  date,
  setDate,
  placeholder = "Pick a date",
}) {
  const presets = [
    { label: "Today", value: { from: startOfToday(), to: startOfToday() } },
    { label: "Yesterday", value: { from: startOfYesterday(), to: startOfYesterday() } },
    { label: "This Week", value: { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: "This Month", value: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: "This Year", value: { from: startOfYear(new Date()), to: endOfYear(new Date()) } },
    { label: "Last 7 Days", value: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Last 30 Days", value: { from: subDays(new Date(), 29), to: new Date() } },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[220px] h-9 justify-start text-left font-normal bg-white border-slate-200 hover:bg-slate-50 rounded-lg group",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
            <span className="text-[13px] font-medium text-slate-700 flex-1">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl flex flex-col md:flex-row" align="start">
          <div className="p-3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-1 bg-slate-50/50 min-w-[140px]">
            <p className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</p>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setDate(preset.value)}
                className="px-2 py-1.5 text-[12px] font-medium text-slate-600 hover:text-primary hover:bg-white rounded-md text-left transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
