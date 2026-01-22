import { useMemo } from "react";
import Chart from "react-apexcharts";

type Props = {
  series: number[];
  labels?: string[];
  colors?: string[];
};

const CircleChart2 = ({
  series,
  labels = ["Completed", "Pending", "Cancelled"],
  colors = ["#27AE60", "#E2B93B", "#EF1E1E"],
}: Props) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        height: 270,
        width: "100%",
      },
      labels,
      colors,
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2,
        colors: ["#fff"],
      },
      plotOptions: {
        pie: {
          donut: {
            size: "75%",
            labels: {
              show: false,
            },
          },
        },
      },
      tooltip: {
        enabled: true,
      },
    }),
    [colors, labels]
  );

  return (
    <div id="circle-chart-2">
      <Chart options={chartOptions} series={series} type="donut" height={270} />
    </div>
  );
};

export default CircleChart2;
