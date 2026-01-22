import { useMemo } from "react";
import Chart from "react-apexcharts";

type Props = {
  data: number[];
  color?: string;
};

const SCol7Chart = ({ data, color = "#0E9384" }: Props) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 60,
        width: 100,
        toolbar: { show: false },
        sparkline: { enabled: true },
      },
      plotOptions: {
        bar: {
          columnWidth: "40%",
          borderRadius: 2,
          endingShape: "rounded",
        },
      },
      stroke: {
        show: false,
      },
      fill: {
        colors: [color],
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: { show: false },
      grid: { show: false },
      tooltip: { enabled: false },
    }),
    [color]
  );

  const series = useMemo(
    () => [
      {
        name: "Data",
        data,
      },
    ],
    [data]
  );

  return (
    <div id="s-col-7">
      <Chart
        options={chartOptions}
        series={series}
        type="bar"
        width={100}
        height={60}
      />
    </div>
  );
};

export default SCol7Chart;
