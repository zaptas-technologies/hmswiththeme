import { useMemo } from "react";
import Chart from "react-apexcharts";

type Props = {
  categories: string[];
  total: number[];
  completed: number[];
  max?: number;
};

const SCol20Chart = ({
  categories,
  total,
  completed,
  max = 400,
}: Props) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        height: 250,
        type: "line",
        toolbar: { show: false },
        stacked: false,
      },
      stroke: {
        width: [0, 2],
        curve: "smooth",
      },
      plotOptions: {
        bar: {
          columnWidth: "15%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: ["solid", "gradient"],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: "#434BAD",
              opacity: 0.4,
            },
            {
              offset: 100,
              color: "#ffffff",
              opacity: 0,
            },
          ],
        },
      },
      colors: ["#3B28CC", "#00B96B"],
      xaxis: {
        categories,
        labels: {
          style: {
            fontSize: "13px",
          },
        },
      },
      yaxis: {
        min: 0,
        max,
        labels: {
          style: {
            fontSize: "13px",
          },
          offsetX: -10,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: function ({ series, dataPointIndex, w }: any) {
          const totalVal = series[0][dataPointIndex];
          const completedVal = series[1][dataPointIndex];
          return `<div class="apex-tooltip">
          <strong>${w.globals.labels[dataPointIndex]}</strong><br/>
          <span style="color:#3B28CC">●</span> Total Appointments: ${totalVal}<br/>
          <span style="color:#00B96B">●</span> Completed: ${completedVal}
        </div>`;
        },
      },
      legend: { show: false },
      grid: {
        borderColor: "#eee",
        strokeDashArray: 4,
        padding: {
          left: 0,
          right: -10,
        },
      },
    }),
    [categories, max]
  );

  const series = useMemo(
    () => [
      {
        name: "Total Appointments",
        type: "bar",
        data: total,
      },
      {
        name: "Completed",
        type: "area",
        data: completed,
      },
    ],
    [completed, total]
  );

  return (
    <div id="s-col-20">
      <Chart options={chartOptions} series={series} type="line" height={250} />
    </div>
  );
};

export default SCol20Chart;
