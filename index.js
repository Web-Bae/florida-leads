const SQUARE_COLORS = ["#253C61", "#724984", "#c64b80", "#fd6756", "#ffa600"];

// dark colors
// ["#253C61", "#724984", "#c64b80", "#fd6756", "#ffa600"];

// light colors
// ["#60a8ff", "#cd92f7", "#ff78be", "#ff7d6c", "#ffa600"];

async function fetchData() {
  const URL =
    "https://fl-leads-dev-transformed-json-data.s3.amazonaws.com/data.json";

  try {
    const response = await fetch(URL);
    const data = await response.json();

    const template = document.querySelector("[chart-element='box']");
    const templateParent = template.parentElement;

    const chartContainers = data.map((chartData) => {
      const { order } = chartData;
      const chartContainer = createChart(chartData, template, templateParent);

      return { order, chartContainer };
    });

    chartContainers.sort((a, b) => a.order - b.order);

    chartContainers.forEach(({ chartContainer }) => {
      templateParent.appendChild(chartContainer);
      chartContainer.classList.remove("hide");
    });
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

fetchData();

// Function to create a chart
function createChart(chartData, template, templateParent) {
  const canvas = document.createElement("canvas");
  const chartContainer = template.cloneNode(true);
  const canvasContainer = chartContainer.querySelector(
    "[chart-element='canvas-container']"
  );
  canvasContainer.appendChild(canvas);
  // templateParent.appendChild(chartContainer);
  // chartContainer.classList.remove("hide");

  const ctx = canvas.getContext("2d");

  const titleElement = chartContainer.querySelector("[chart-element='title']");
  const descriptionElement = chartContainer.querySelector(
    "[chart-element='description']"
  );

  titleElement.textContent = chartData.title;
  descriptionElement.textContent = chartData.description;

  if (chartData.type === "PIE") {
    const pieData = chartData.data.map((item) => ({
      label: item.label,
      value: item.value,
    }));
    // Render pie chart
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: pieData.map((d) => d.label),
        datasets: [
          {
            data: pieData.map((d) => d.value),
            backgroundColor: pieData.map((d, index) => {
              return SQUARE_COLORS[index % SQUARE_COLORS.length];
            }),
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
          title: {
            display: false,
            text: chartData.title,
          },
          datalabels: {
            color: "white",
            font: {
              weight: "normal",
              size: 14,
            },
            backgroundColor: pieData.map((d, index) => {
              const color = SQUARE_COLORS[index % SQUARE_COLORS.length];
              return darkenHexColor(color, 30);
            }),
            padding: 8,
            borderRadius: 5,
            formatter: (value, context) => {
              const label = context.chart.data.labels[context.dataIndex];
              const lines = wrapText(ctx, label, 100);
              return lines.join("\n") + `\n${value}%`;
            },
            display: "auto",
            anchor: "center",
            align: "start",
            offset: function (context) {
              const chartArea = context.chart.chartArea;
              const radius = (chartArea.right - chartArea.left) / 2; // Calculate radius based on chart area
              return radius * -0.45; // Offset inward by 25% of the radius
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  } else if (chartData.type === "BAR") {
    const barData = chartData.bars.map((bar) => ({
      label: bar.label,
      value: bar.value,
    }));

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: barData.map((d) => d.label),
        datasets: [
          {
            data: barData.map((d) => d.value),
            backgroundColor: barData.map((d, index) => {
              return SQUARE_COLORS[index % SQUARE_COLORS.length];
            }),
            borderColor: barData.map((d, index) => {
              return SQUARE_COLORS[index % SQUARE_COLORS.length];
            }),
            borderWidth: 1,
          },
        ],
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        aspectRatio: 1,
        plugins: {
          title: {
            display: false,
            text: chartData.group, // Set the title as the group name
          },
          legend: {
            display: true,
            position: "top",
            align: "start",
            labels: {
              boxWidth: 20,
              padding: 10,
              generateLabels: (chart) => {
                return chartData.bars.map((bar, index) => ({
                  text: `${bar.label} (Value: ${bar.value})                           `,
                  fillStyle: SQUARE_COLORS[index % SQUARE_COLORS.length],
                  lineWidth: 0,
                }));
              },
            },
          },
          datalabels: {
            color: "white",
            font: {
              weight: "normal",
              size: 14,
            },
            backgroundColor: barData.map((d, index) => {
              const color = SQUARE_COLORS[index % SQUARE_COLORS.length];
              return darkenHexColor(color, 30);
            }),
            borderRadius: 5,
            formatter: (value, context) => {
              return value.toFixed(2);
            },
            display: "auto",
            anchor: "end",
            align: "start",
            offset: 16,
          },
        },
        scales: {
          x: {
            ticks: {
              // no labels under bars
              display: false,
            },
          },
          y: {
            beginAtZero: false,
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  } else if (chartData.type === "HORIZONTAL") {
    const barData = chartData.data.map((item) => ({
      label: item.label,
      value: item.value,
    }));

    // Set canvas height dynamically
    canvas.height = barData.length * 60; // Adjust as needed

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: barData.map((d) => d.label),
        datasets: [
          {
            data: barData.map((d) => d.value),
            backgroundColor: barData.map((d, index) => {
              return SQUARE_COLORS[index % SQUARE_COLORS.length];
            }),
            borderColor: barData.map((d, index) => {
              return SQUARE_COLORS[index % SQUARE_COLORS.length];
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
          },
          legend: {
            display: false,
          },
          datalabels: {
            color: "white",
            font: {
              weight: "normal",
              size: 12,
            },
            backgroundColor: barData.map((d, index) => {
              const color = SQUARE_COLORS[index % SQUARE_COLORS.length];
              return darkenHexColor(color, 30);
            }),
            borderRadius: 5,
            formatter: (value, context) => {
              const label = context.chart.data.labels[context.dataIndex];
              // wrap
              const lines = wrapText(ctx, label, 300);
              return lines.join("\n") + `: ${value.toFixed(2)}`;
            },
            display: "auto",
            anchor: "start",
            align: "end",
            offset: 8,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 12,
              },
            },
          },
          y: {
            ticks: {
              autoSkip: false,
              font: {
                size: 12,
              },
              display: false,
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

  return chartContainer;
}

// Handle special cases: render a bulleted list instead of a chart
// function handleSpecialCases(chartData, container) {
//   const data = chartData.data.map((item) => ({
//     label: item.label,
//     value: item.value,
//   }));
//   console.log("Special case: render a bulleted list");
//   console.log({ data });
//   container.innerHTML = ""; // Clear the container

//   const ul = document.createElement("ul"); // Create an unordered list element

//   data.forEach((item) => {
//     const li = document.createElement("li"); // Create a list item for each data label
//     li.textContent = item.label; // Set the label text
//     ul.appendChild(li); // Add the list item to the unordered list
//   });

//   container.appendChild(ul); // Append the list to the container
//   const parentElement = container.parentElement;
//   container.remove();
//   parentElement.appendChild(container);
// }

// Helper function to convert hex color to HSL
function hexToHSL(hex) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find the maximum and minimum values of R, G and B
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Helper function to convert HSL back to hex
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0");
  g = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0");
  b = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
}

// Function to darken the hex color
function darkenHexColor(hex, amount) {
  let { h, s, l } = hexToHSL(hex);
  l = Math.max(l - amount, 0); // Reduce the lightness by `amount` to darken
  return hslToHex(h, s, l);
}

// Helper function to abbreviate labels
function abbreviateLabel(label, maxLabelWidth = 20) {
  if (label.length > maxLabelWidth) {
    return label.substring(0, maxLabelWidth) + "...";
  }
  return label;
}

function getValue(value) {
  if (typeof value === "string") {
    return parseFloat(value.replace("Decimal(", "").replace(")", ""));
  }
  return value;
}

// Word wrapping function
function wrapText(context, text, maxWidth) {
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
}
/*
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
*/
