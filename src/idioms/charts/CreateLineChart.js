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
  "Wyoming": "WY"
};

export function createLineChart(data) {
  // Clear any existing SVG elements
  d3.select(".LineChart").selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 1300,
    height = 200;

  const svg = d3.select(".LineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Parse the date format
  const parseDate = d3.timeParse("%Y-%m-%d");

  // Convert date strings to actual date objects for easier manipulation
  data.forEach(d => {
    d.date = parseDate(d.date); // Assuming 'date' field exists in the data in YYYY-MM-DD format
  });

  // Group the data by state and by month
  const nestedData = d3.group(data, d => d.state, d => d3.timeFormat("%Y-%m")(d.date)); // Group by Year-Month
  const states = Array.from(nestedData.keys());
  
  // Create an array of months for the x-axis
  const months = Array.from(new Set(data.map(d => d3.timeFormat("%Y-%m")(d.date)))).sort(d3.ascending);
  
  // Create x and y scales
  const x = d3.scalePoint()
    .domain(months) // Use the month-year format as the domain
    .range([0, width])
    .padding(0.5); // Add some padding between ticks

  const y = d3.scaleLinear()
    .domain([0, d3.max(states, state => d3.max(months, month => {
      const monthlyData = nestedData.get(state).get(month);
      return monthlyData ? monthlyData.length : 0;
    }))])
    .range([height, 0]);

  // Create x and y axes
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)) // Show month and year format
    .selectAll("text") // Select all text elements for custom formatting
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)") // Rotate for better visibility
    .style("font-size", "10px"); // Adjust font size if needed

  const yAxis = svg.append("g").call(d3.axisLeft(y));

  // Add x-axis label
  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.bottom - 10)

  // Add y-axis label
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)

  // Tooltip setup
  const tooltip = d3.select(".LineChart")
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

  // Use a single color (subtle shade of red) for all lines
  const lineColor = "#d66a6a"; // A less vibrant shade of red
  const highlightColor = "#ffa500"; // A bright orange for the hover highlight

  // Function to draw lines
  function drawLines(filteredData, xScale, xDomain) {
    svg.selectAll(".line").remove();

    states.forEach(state => {
      const stateData = xDomain.map(month => ({
        state: state,
        month: month,
        count: filteredData.get(state).get(month)?.length || 0,
        injured: filteredData.get(state).get(month)?.reduce((sum, d) => sum + d.injured, 0) || 0,
        killed: filteredData.get(state).get(month)?.reduce((sum, d) => sum + d.killed, 0) || 0
      }));

      const line = svg.append("path")
        .datum(stateData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", lineColor) // Apply the subtle red color to all lines
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(d => x(d.month))
          .y(d => y(d.count))
        );

      // Tooltip and hover events with better highlight color
      line.on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", highlightColor).attr("stroke-width", 3); // Highlight with a different color
        tooltip.style("opacity", 1).style("pointer-events", "auto"); // Enable pointer-events when visible;

        // Dispatch custom event
        const highlightEvent = new CustomEvent('highlightState', { detail: { state } });
        window.dispatchEvent(highlightEvent);
      })
      .on("mousemove", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.html(`State: ${state}<br>Total Incidents: ${d3.sum(stateData, d => d.count)}`)
          .style("left", (xPos + 70) + "px")
          .style("top", (yPos) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", lineColor).attr("stroke-width", 1.5); // Revert to original color on mouse out
        tooltip.style("opacity", 0).style("pointer-events", "none"); // Disable pointer-events when hidden;

        // Dispatch custom event to remove highlight
        const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { state } });
        window.dispatchEvent(removeHighlightEvent);
      });
    });
  }

  drawLines(nestedData, x, months);

  window.addEventListener('highlightState', (event) => {
    const { state } = event.detail;
    const { stateAbbreviation } = event.detail;
    d3.selectAll(".line")
      .filter(function(d) {
        // Assuming each line's data has a state property
        return d[0].state === state || stateNameToAbbreviation[d[0].state] === stateAbbreviation;
      })
      .attr("stroke", highlightColor)
      .attr("stroke-width", 3);
  });

  window.addEventListener('removeHighlightState', (event) => {
    d3.selectAll(".line")
      .attr("stroke", lineColor)
      .attr("stroke-width", 1.5);
  });
}