import * as d3 from "d3";

const stateNameToAbbreviation = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
  "District of Columbia": "DC"
};

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
  const groupedData = d3.group(data, d => d.state, d => d.date ? d.date.getFullYear() : null);

  // Prepare scatter plot data
  const scatterData = Array.from(groupedData, ([state, yearGroup]) => {
    return Array.from(yearGroup, ([year, incidents]) => ({
      state: state,
      year: year,
      total_injured: d3.sum(incidents, d => d.n_injured), // Total injuries for the state and year
      total_killed: d3.sum(incidents, d => d.n_killed)    // Total kills for the state and year
    }));
  }).flat();

  // Create x and y scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_killed) || 1])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_injured) || 1])
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
  .style("position", "absolute")
  .style("pointer-events", "none"); // Ensure the tooltip doesn't block interactions when hidden

  const dotColor = "#d66a6a";  // Color of the scatter plot dots
  const highlightColor = "#ffcc00"; // Highlight color for the hover event

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
      tooltip.style("opacity", 1).style("pointer-events", "auto"); // Enable pointer-events when visible
  
      // Dispatch custom event to highlight the same state in the line chart
      const highlightEvent = new CustomEvent('highlightState', { detail: { state: d.state } });
      window.dispatchEvent(highlightEvent);
    })
    .on("mousemove", function(event, d) {
      // Update tooltip HTML content
      tooltip.html(`State: ${d.state}<br>Year: ${d.year}<br>Total Injuries: ${d.total_injured}<br>Total Kills: ${d.total_killed}`);
      // Update tooltip position to follow the mouse
      tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", dotColor).attr("r", 5); // Revert to original color and size
      tooltip.style("opacity", 0).style("pointer-events", "none"); // Disable pointer-events when hidden
  
      // Dispatch custom event to remove highlight from the line chart
      const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { state: d.state } });
      window.dispatchEvent(removeHighlightEvent);
    });

  // Listen for custom events to highlight scatter plot dots
  window.addEventListener('highlightState', (event) => {
    const { state } = event.detail;
    dots.filter(d => d.state === state)
      .attr("fill", highlightColor)
      .attr("r", 7);
  });

  window.addEventListener('removeHighlightState', (event) => {
    dots
      .attr("fill", dotColor)
      .attr("r", 5);
  });

   // Listen for custom events to highlight scatter plot dots
   window.addEventListener('highlightState', (event) => {
    const { stateAbbreviation } = event.detail;
    dots.filter(d => stateNameToAbbreviation[d.state] === stateAbbreviation)
      .attr("fill", highlightColor)
      .attr("r", 7);
  });

  window.addEventListener('filterState', (event) => {
    const { stateAbbreviation } = event.detail;
    dots.filter(d => stateNameToAbbreviation[d.state] !== stateAbbreviation)
      .attr("r", 0);
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

  // Linear regression line calculation
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
