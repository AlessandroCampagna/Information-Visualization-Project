import * as d3 from 'd3';

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

  // Parse the date format
  const parseDate = d3.timeParse("%Y-%m-%d");

  // Convert date strings to actual date objects and group by state and month/year
  const nestedData = d3.group(data, d => d.state, d => d3.timeFormat("%Y-%m")(parseDate(d.date)));

  const scatterData = Array.from(nestedData, ([state, months]) => {
    return Array.from(months, ([month, incidents]) => {
      return {
        state: state,
        month: month,
        total_injured: d3.sum(incidents, d => d.n_injured), // Total injuries for the month
        total_killed: d3.sum(incidents, d => d.n_killed)    // Total kills for the month
      };
    });
  }).flat(); // Flatten the array to a single level

  // Create x and y scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_killed)]) // Set the max for the x-axis based on the max kills
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_injured)]) // Set the max for the y-axis based on the max injuries
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
  svg.selectAll(".dot")
    .data(scatterData) // Bind the grouped and aggregated dataset
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
      const [xPos, yPos] = d3.pointer(event);
      tooltip.html(`State: ${d.state}<br>Month: ${d.month}<br>Total Injuries: ${d.total_injured}<br>Total Kills: ${d.total_killed}`)
        .style("left", (xPos + 70) + "px")
        .style("top", (yPos) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("fill", dotColor).attr("r", 5); // Revert to original color and size
      tooltip.style("opacity", 0);
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
}
