const LIGHT_BLUE = "#019cff";
const DARK_BLUE = "#253c61";

// Word wrapping function
const wrapText = (context, text, maxWidth) => {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  words.forEach((word) => {
    const testLine = `${line}${word} `;
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && line.length > 0) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = testLine;
    }
  });
  lines.push(line.trim());
  return lines;
};

const externalLabelsPlugin = {
  id: "externalLabelsPlugin",
  afterDraw: (chart) => {
    const {
      ctx,
      chartArea: { top, width, height },
      canvas: { height: canvasHeight },
    } = chart;
    const linesOutsideChart = ctx.linesOutsideChart || [];
    const containerWidth =
      document.querySelector("#chartsContainer").offsetWidth;

    const labelAreaWidth = Math.min(containerWidth * 0.3, 250); // Reduced max width to 150px
    const labelStartX = containerWidth - labelAreaWidth - 10; // Start 10px from the right edge of the canvas
    let currentY = top; // Start from the top of the chart area

    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    const radius = Math.min(width, height) / 2;

    const wrapText = (ctx, text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    linesOutsideChart.forEach((item, index) => {
      const labelX = labelStartX; // Start from the calculated start position
      const labelY = currentY;

      // Calculate label lines with wrapped text
      const titleLines = wrapText(ctx, item.title, labelAreaWidth - 10);
      const labelLines = [
        ...titleLines,
        `Mean: ${item.mean.toFixed(2)}`,
        `Total: ${item.total_sum}`,
        `Count: ${item.total_count}`,
      ];
      const labelHeight = labelLines.length * 15 + 10; // 15px line height + 10px padding

      // Draw white background for label
      ctx.fillStyle = "white";
      ctx.fillRect(labelX, labelY, labelAreaWidth, labelHeight);

      // Draw border for label box
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelAreaWidth, labelHeight);

      // Draw label
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      labelLines.forEach((line, i) => {
        ctx.fillText(line, labelX + 5, labelY + 5 + i * 15);
      });

      // Calculate the angle to the center of the label box
      const labelCenterX = labelX;
      const labelCenterY = labelY + labelHeight / 2;
      const angleToLabel = Math.atan2(
        labelCenterY - centerY,
        labelCenterX - centerX
      );

      // Find the point on the pie chart closest to the label
      const pieX = centerX + Math.cos(angleToLabel) * radius;
      const pieY = centerY + Math.sin(angleToLabel) * radius;

      // Draw line from chart to label
      ctx.beginPath();
      ctx.moveTo(pieX, pieY);
      ctx.lineTo(labelX, labelCenterY);
      ctx.stroke();

      // Update currentY for the next label
      currentY += labelHeight + 5; // 5px gap between labels

      // If the next label would go off the bottom of the canvas, stop drawing labels
      if (currentY + labelHeight > canvasHeight) {
        return; // This will break the forEach loop
      }
    });
  },
};

async function fetchData() {
  const URL =
    "https://florida-leads-sample-data.s3.amazonaws.com/sample_data.json";

  fetch(URL)
    .then((response) => response.json())
    .then((data) => {
      console.log({ data });

      data.forEach((chartData) => {
        createChart(chartData);
      });
    })
    .catch((error) => {
      console.error("Error fetching data", error);
    });
}
fetchData();

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
      value: item.value,
    }));

    const linesOutsideChart = chartData.lines_outside_chart || [];

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: pieData.map((d) => d.label),
        datasets: [
          {
            data: pieData.map((d) => d.value),
            backgroundColor: [LIGHT_BLUE, DARK_BLUE],
            hoverBackgroundColor: [LIGHT_BLUE, DARK_BLUE],
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 2,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
          title: {
            display: true,
            text: chartData.title,
          },
          datalabels: {
            color: "white",
            font: {
              weight: "bold",
              size: 12,
            },
            formatter: (value, context) => {
              const label = context.chart.data.labels[context.dataIndex];
              return `${label}: ${value}%`;
            },
            anchor: "center",
            align: "center",
          },
        },
      },
      plugins: [
        ChartDataLabels,
        externalLabelsPlugin,
        // {
        //   id: "customPosition",
        //   beforeDraw: (chart) => {
        //     const { ctx, chartArea } = chart;
        //     const offsetX = -chartArea.width / 4; // Adjust the offset to shift left

        //     ctx.save();
        //     ctx.translate(offsetX, 0);
        //     chart.chartArea.left += offsetX;
        //     chart.chartArea.right += offsetX;
        //   },
        //   afterDraw: (chart) => {
        //     chart.ctx.restore();
        //   },
        // },
      ],
    });

    // Pass the linesOutsideChart data to the plugin
    ctx.linesOutsideChart = linesOutsideChart;
  } else if (chartData.type === "BAR") {
    const barData = chartData.bars.map((bar) => ({
      label: bar.label,
      value: getValue(bar.value),
    }));

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: barData.map((d) => d.label),
        datasets: [
          {
            label: "Count",
            data: barData.map((d) => d.value),
            backgroundColor: LIGHT_BLUE,
            borderColor: DARK_BLUE,
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
                const maxLabelWidth = 80; // Set max width for the labels
                const lines = wrapText(
                  ctx,
                  barData[index].label,
                  maxLabelWidth
                );
                return lines.length > 1
                  ? lines.join("\n")
                  : barData[index].label;
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
