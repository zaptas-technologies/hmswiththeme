import { useMemo } from "react";
import Chart from "react-apexcharts";

type CircleChartProps = {
  departments?: Array<{ name: string; count: number }>;
};

const CircleChart = ({ departments = [] }: CircleChartProps) => {
  // Prepare chart data from departments
  const chartData = useMemo(() => {
    const top3 = departments.slice(0, 3);
    const labels = top3.map((dept) => `${dept.count} ${dept.name}`);
    const series = top3.map((dept) => dept.count);
    
    // If no departments, use default empty data
    if (top3.length === 0) {
      return {
        labels: ["No Data"],
        series: [0],
      };
    }
    
    return {
      labels,
      series,
    };
  }, [departments]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: "donut",
      height: 270,
      width: "100%",
    },
    labels: chartData.labels,
    colors: ["#6DA6F2", "#5C60CC", "#9B51B6"],
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
          size: "60%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 400,
              offsetY: -10,
              color: "#0A1B39",
            },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 700,
              offsetY: 10,
              color: "#0A1B39",
            },
            total: {
              show: true,
              label: "Total Patient",
              fontSize: "14px",
              color: "#0A1B39",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
    },
  }), [chartData.labels]);

  return (
    <div id="circle-chart">
      <Chart options={chartOptions} series={chartData.series} type="donut" height={270} />
    </div>
  );
};

export default CircleChart;
