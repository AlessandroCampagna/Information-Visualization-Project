import * as d3 from "d3";
import { stateNameToAbbreviation } from "../channels/MapStates";
import * as color from "../channels/Colors";

function addEventListeners(dots) {
  window.addEventListener('highlightState', (event) => handleHighlightState(event, dots));
  window.addEventListener('removeHighlightState', () => handleRemoveHighlightState(dots));
  window.addEventListener('filterState', (event) => handleFilterState(event, dots));
}

function handleHighlightState(event, dots) {
  const { state, stateAbbreviation } = event.detail;
  dots.filter(d => d.state === state || stateNameToAbbreviation[d.state] === stateAbbreviation)
    .attr("fill", color.highlight)
    .attr("r", 7);
}

function handleRemoveHighlightState(dots) {
  dots.attr("fill", color.primary).attr("r", 5);
}

function handleFilterState(event, dots) {
  const { stateAbbreviation } = event.detail;
  dots.filter(d => stateNameToAbbreviation[d.state] !== stateAbbreviation)
    .attr("r", 0);
}

function createTooltip() {
  return d3.select(".ScatterPlot")
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

function createPoints(svg, scatterData, x, y) {
  const tooltip = createTooltip();

  const dots = svg.selectAll(".dot")
    .data(scatterData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.total_killed))
    .attr("cy", d => y(d.total_injured))
    .attr("r", 5)
    .attr("fill", color.primary)
    .attr("stroke", "black")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", color.highlight).attr("r", 7);
      tooltip.style("opacity", 1).style("pointer-events", "auto");

      const highlightEvent = new CustomEvent('highlightState', { detail: { state: d.state } });
      window.dispatchEvent(highlightEvent);
    })
    .on("mousemove", function(event, d) {
      tooltip.html(`State: ${d.state}<br>Year: ${d.year}<br>Total Injuries: ${d.total_injured}<br>Total Kills: ${d.total_killed}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", color.primary).attr("r", 5);
      tooltip.style("opacity", 0).style("pointer-events", "none");

      const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { state: d.state } });
      window.dispatchEvent(removeHighlightEvent);
    });

  return dots;
}

function createAxes(svg, x, y, width, height, margin) {
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Number of Kills");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("Number of Injuries");
}

function prepareScatterData(data) {
  const groupedData = d3.group(data, d => d.state, d => d.date ? d.date.getFullYear() : null);

  return Array.from(groupedData, ([state, yearGroup]) => {
    return Array.from(yearGroup, ([year, incidents]) => ({
      state: state,
      year: year,
      total_injured: d3.sum(incidents, d => d.n_injured),
      total_killed: d3.sum(incidents, d => d.n_killed)
    }));
  }).flat();
}

function createSvgContainer(margin, width, height) {
  return d3.select(".ScatterPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}

function createScales(scatterData, width, height) {
  const x = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_killed) || 1])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(scatterData, d => d.total_injured) || 1])
    .range([height, 0]);

  return { x, y };
}

function calculateRegressionLine(scatterData, x, y) {
  const xMean = d3.mean(scatterData, d => d.total_killed);
  const yMean = d3.mean(scatterData, d => d.total_injured);
  const numerator = d3.sum(scatterData, d => (d.total_killed - xMean) * (d.total_injured - yMean));
  const denominator = d3.sum(scatterData, d => Math.pow(d.total_killed - xMean, 2));
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  return d3.line()
    .x(d => x(d.total_killed))
    .y(d => y(slope * d.total_killed + intercept));
}

export function createScatterPlot(data) {
  d3.select(".ScatterPlot").selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 500,
    height = 200;

  const svg = createSvgContainer(margin, width, height);
  const scatterData = prepareScatterData(data);
  const { x, y } = createScales(scatterData, width, height);

  createAxes(svg, x, y, width, height, margin);

  const dots = createPoints(svg, scatterData, x, y);
  const line = calculateRegressionLine(scatterData, x, y);

  addEventListeners(dots);

  svg.append("path")
    .datum(scatterData)
    .attr("class", "regression-line")
    .attr("d", line)
    .attr("stroke", "gray")
    .attr("stroke-width", 2)
    .attr("fill", "none");
}