import * as d3 from 'd3';

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
  const x = d3.scaleBand()
    .domain(months) // Use the month-year format as the domain
    .range([0, width])
    .padding(0.1); // Add some padding between bars

  const y = d3.scaleLinear()
    .domain([0, d3.max(states, state => d3.max(months, month => {
      const monthlyData = nestedData.get(state).get(month);
      return monthlyData ? monthlyData.length : 0;
    }))])
    .range([height, 0]);

  // Create x and y axes
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y"))); // Show month and year format

  const yAxis = svg.append("g").call(d3.axisLeft(y));

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
    .style("position", "absolute");

  // Use a single color (subtle shade of red) for all lines
  const lineColor = "#d66a6a"; // A less vibrant shade of red
  const highlightColor = "#ffa500"; // A bright orange for the hover highlight

  // Function to draw lines
  function drawLines(filteredData, xScale, xDomain) {
    svg.selectAll(".line").remove();

    states.forEach(state => {
      const stateData = xDomain.map(month => ({
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
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.html(`State: ${state}<br>Total Incidents: ${d3.sum(stateData, d => d.count)}`)
          .style("left", (xPos + 70) + "px")
          .style("top", (yPos) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", lineColor).attr("stroke-width", 1.5); // Revert to original color on mouse out
        tooltip.style("opacity", 0);
      });
    });
  }

  drawLines(nestedData, x, months);

  // Labels and reset button
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Month");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("Number of Incidents");

  // Reset button to restore the full-year view
  d3.select(".LineChart").append("button").attr("id", "resetButton").text("Reset")
    .style("display", "none").on("click", function() {
      createLineChart(data); // Reset chart to show all data again
    });
}