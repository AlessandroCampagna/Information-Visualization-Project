import * as d3 from "d3";

export function createScatterPlot(data) {
  // Clear any existing SVG elements
  d3.select(".ScatterPlot").selectAll("*").remove();
  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 500,
    height = 200;
  const svg = d3.select(".ScatterPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  // Group data by state and year
  const groupedData = d3.group(data, d => d.state, d => {
    // Assuming `d.date` is already a Date object
    return d.date ? d.date.getFullYear() : null; // Extract year directly from the Date object
  });
  // Check for grouped data
  console.log("Grouped Data: ", groupedData);
  const scatterData = Array.from(groupedData, ([state, yearGroup]) => {
    return Array.from(yearGroup, ([year, incidents]) => {
      return {
        state: state,
        year: year,
        total_injured: d3.sum(incidents, d => d.n_injured), // Total injuries for the state and year
        total_killed: d3.sum(incidents, d => d.n_killed)    // Total kills for the state and year
      };
    });
  }).flat(); // Flatten the array to make it a single array of objects
  // Log the aggregated data
  console.log("Aggregated Data: ", scatterData);
  // Create x and y scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_killed) || 1]) // Ensure there is a max value for scaling
    .range([0, width]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_injured) || 1]) // Ensure there is a max value for scaling
    .range([height, 0]);
  // Create x and y axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)); // X-axis for number of kills
  svg.append("g").call(d3.axisLeft(y)); // Y-axis for number of injuries
  // Tooltip setup
  const tooltip = d3.select(".ScatterPlot")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute");
  const dotColor = "#d66a6a";  // Color of the scatter plot dots
  const highlightColor = "#ffa500"; // Highlight color for the hover event
  // Draw scatter plot points
  const dots = svg.selectAll(".dot")
    .data(scatterData) // Bind the data
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.total_killed)) // X-axis for total kills
    .attr("cy", d => y(d.total_injured)) // Y-axis for total injuries
    .attr("r", 5) // Radius of the scatter plot dots
    .attr("fill", dotColor)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", highlightColor).attr("r", 7); // Highlight the dot on hover
      tooltip.style("opacity", 1);
    })
    .on("mousemove", function(event, d) {
      // Update tooltip HTML content
      tooltip.html(`State: ${d.state}<br>Year: ${d.year}<br>Total Injuries: ${d.total_injured}<br>Total Kills: ${d.total_killed}`);
      // Update tooltip position to follow the mouse
      tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
  })
    .on("mouseout", function() {
      d3.select(this).attr("fill", dotColor).attr("r", 5); // Revert to original color and size
      tooltip.style("opacity", 0);
    });

  // Listen for custom events to highlight scatter plot dots
  window.addEventListener('highlightState', (event) => {
    const { state } = event.detail;
    dots.filter(d => d.state === state)
      .attr("fill", highlightColor)
      .attr("r", 7);
  });

  window.addEventListener('removeHighlightState', (event) => {
    const { state } = event.detail;
    dots.filter(d => d.state === state)
      .attr("fill", dotColor)
      .attr("r", 5);
  });

  // Labels for x and y axes
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Number of Kills"); // X-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("Number of Injuries"); // Y-axis label
  // Reset button to restore the full-year view
  d3.select(".ScatterPlot").append("button").attr("id", "resetButton").text("Reset")
    .style("display", "none").on("click", function() {
      createScatterPlot(data); // Reset chart to show all data again
    });

  // Calculate the linear regression line
  const xMean = d3.mean(scatterData, d => d.total_killed);
  const yMean = d3.mean(scatterData, d => d.total_injured);
  const numerator = d3.sum(scatterData, d => (d.total_killed - xMean) * (d.total_injured - yMean));
  const denominator = d3.sum(scatterData, d => Math.pow(d.total_killed - xMean, 2));
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Define the line function
  const line = d3.line()
    .x(d => x(d.total_killed))
    .y(d => y(slope * d.total_killed + intercept));

  // Draw the regression line
  svg.append("path")
    .datum(scatterData)
    .attr("class", "regression-line")
    .attr("d", line)
    .attr("stroke", "gray")
    .attr("stroke-width", 2)
    .attr("fill", "none");
}