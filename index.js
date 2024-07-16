const URL =
  "https://florida-leads-sample-data.s3.amazonaws.com/sample_data.json";

try {
  const response = await fetch(URL);
  const data = await response.json();

  console.log({ data });

  data.forEach((chartData) => {
    createChart(chartData);
  });
} catch (error) {
  console.error("Error fetching data", error);
}

// Function to create a chart
function createChart(chartData) {
  const chartContainer = document.createElement("div");
  const canvas = document.createElement("canvas");
  chartContainer.appendChild(canvas);
  document.getElementById("chartsContainer").appendChild(chartContainer);
  const ctx = canvas.getContext("2d");

  if (chartData.type === "PIE") {
    const pieData = chartData.data.map((item) => ({
      label: item.label,
      value: parseFloat(item.value.replace("Decimal(", "").replace(")", "")),
    }));

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: pieData.map((d) => d.label),
        datasets: [
          {
            data: pieData.map((d) => d.value),
            backgroundColor: ["#FF6384", "#36A2EB"],
            hoverBackgroundColor: ["#FF6384", "#36A2EB"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            enabled: true,
          },
          title: {
            display: true,
            text: chartData.title,
          },
        },
      },
    });
  } else if (chartData.type === "BAR") {
    const barData = chartData.bars.map((bar) => ({
      label: bar.label,
      value: getValue(bar.value),
    }));

    // Abbreviate labels for display
    const abbreviatedLabels = barData.map((d) => abbreviateLabel(d.label));

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: abbreviatedLabels,
        datasets: [
          {
            label: "Count",
            data: barData.map((d) => d.value),
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: chartData.title,
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                // Display the full label in the tooltip
                const fullLabel = barData[tooltipItem.dataIndex].label;
                return `${fullLabel}: ${tooltipItem.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: chartData.axes.x.label,
            },
            ticks: {
              callback: function (value, index, values) {
                return abbreviatedLabels[index];
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: chartData.axes.y.label,
            },
            max: chartData.axes.y.range.end,
          },
        },
      },
    });
  }
}

// Helper function to abbreviate labels
function abbreviateLabel(label) {
  if (label.length > 15) {
    return label.substring(0, 15) + "...";
  }
  return label;
}

function getValue(value) {
  if (typeof value === "string") {
    return parseFloat(value.replace("Decimal(", "").replace(")", ""));
  }
  return value;
}
