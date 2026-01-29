import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { AppointmentTrend } from "../../../../../api/dashboard";

type SCol19ChartProps = {
  appointmentTrend?: AppointmentTrend | null;
};

const SCol19Chart = ({ appointmentTrend }: SCol19ChartProps) => {
  const categories = appointmentTrend?.categories ?? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const total = appointmentTrend?.total ?? Array(12).fill(0);
  const completed = appointmentTrend?.completed ?? Array(12).fill(0);
  const other = useMemo(() => total.map((t, i) => Math.max(0, (t || 0) - (completed[i] || 0))), [total, completed]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar" as const,
        height: 250,
        stacked: true,
        toolbar: { show: false },
        sparkline: { enabled: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "25%",
          borderRadius: 3,
          distributed: false,
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 0, colors: ["#fff"] },
      colors: ["#00D1D1", "#1E90FF", "#3B28CC"],
      xaxis: {
        categories,
        labels: { style: { fontSize: "14px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickPlacement: "between",
      },
      yaxis: {
        labels: { style: { fontSize: "14px" }, formatter: (val: number) => (val >= 1000 ? `${val / 1000}K` : String(val)), offsetX: -10 },
      },
      legend: { position: "bottom" as const },
      grid: { show: true, strokeDashArray: 4, padding: { left: 0, right: -10 } },
      tooltip: { enabled: true },
    }),
    [categories]
  );

  const series = useMemo(
    () => [
      { name: "Completed", data: completed },
      { name: "Other", data: other },
    ],
    [completed, other]
  );

  return (
    <div id="s-col-19">
      <Chart options={chartOptions} series={series} type="bar" height={250} />
    </div>
  );
};

export default SCol19Chart;
