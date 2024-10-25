import * as d3 from "d3";
import { stateNameToAbbreviation } from "../channels/MapStates";
import * as color from "../channels/Colors";

function addEventListeners() {
  window.addEventListener('highlightState', handleHighlightState);
  window.addEventListener('filterState', handleFilterState);
  window.addEventListener('removeHighlightState', handleRemoveHighlightState);
}

function handleHighlightState(event) {
  const { state, stateAbbreviation } = event.detail;
  d3.selectAll(".line")
    .filter(d => d[0].state === state || stateNameToAbbreviation[d[0].state] === stateAbbreviation)
    .attr("stroke", color.highlight)
    .attr("stroke-width", 3);
}

function handleFilterState(event) {
  const { stateAbbreviation } = event.detail;
  d3.selectAll(".line")
    .filter(d => stateNameToAbbreviation[d[0].state] !== stateAbbreviation)
    .attr("stroke-width", 0);
}

function handleRemoveHighlightState() {
  d3.selectAll(".line")
    .attr("stroke", color.primary)
    .attr("stroke-width", 1.5);
}

function createTooltip() {
  return d3.select(".LineChart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .style("pointer-events", "none");
}

function createLine(svg, stateData, x, y, state, tooltip) {
  const line = svg.append("path")
    .datum(stateData)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", color.primary)
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(d => x(d.month))
      .y(d => y(d.count))
    );

  line.on("mouseover", function(event) {
    d3.select(this).attr("stroke", color.highlight).attr("stroke-width", 3);
    tooltip.style("opacity", 1).style("pointer-events", "auto");
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
    d3.select(this).attr("stroke", color.primary).attr("stroke-width", 1.5);
    tooltip.style("opacity", 0).style("pointer-events", "none");
    const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { state } });
    window.dispatchEvent(removeHighlightEvent);
  });
}

function createLines(filteredData, x, y, xDomain, svg, states) {
  svg.selectAll(".line").remove();
  const tooltip = createTooltip();

  states.forEach(state => {
    const stateData = xDomain.map(month => ({
      state: state,
      month: month,
      count: filteredData.get(state).get(month)?.length || 0,
      injured: filteredData.get(state).get(month)?.reduce((sum, d) => sum + d.injured, 0) || 0,
      killed: filteredData.get(state).get(month)?.reduce((sum, d) => sum + d.killed, 0) || 0
    }));

    createLine(svg, stateData, x, y, state, tooltip);
  });
}

function setupSvg() {
  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 1300,
    height = 200;

  const svg = d3.select(".LineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  return { svg, margin, width, height };
}

function setupScales(data, width, height) {
  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach(d => d.date = parseDate(d.date));

  const nestedData = d3.group(data, d => d.state, d => d3.timeFormat("%Y-%m")(d.date));
  const states = Array.from(nestedData.keys());
  const months = Array.from(new Set(data.map(d => d3.timeFormat("%Y-%m")(d.date)))).sort(d3.ascending);

  const x = d3.scalePoint()
    .domain(months)
    .range([0, width])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max(states, state => d3.max(months, month => {
      const monthlyData = nestedData.get(state).get(month);
      return monthlyData ? monthlyData.length : 0;
    }))])
    .range([height, 0]);

  return { x, y, nestedData, states, months };
}

function drawAxes(svg, x, y, width, height, margin) {
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .style("font-size", "10px");

  svg.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.bottom - 10);

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top + 20)
    .text("Number of Incidents");

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top);
}

export function createLineChart(data) {
  d3.select(".LineChart").selectAll("*").remove();

  const { svg, margin, width, height } = setupSvg();
  const { x, y, nestedData, states, months } = setupScales(data, width, height);

  drawAxes(svg, x, y, width, height, margin);
  createLines(nestedData, x, y, months, svg, states);
  addEventListeners();
}