// src/idioms/createLineChart.js

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

  const nestedData = d3.group(data, d => d.state, d => d.year);
  const states = Array.from(nestedData.keys());
  const years = Array.from(new Set(data.map(d => d.year))).sort();

  const x = d3.scalePoint()
    .domain(years)
    .range([0, width]);

  let y = d3.scaleLinear()
    .domain([0, d3.max(states, state => d3.max(years, year => nestedData.get(state).get(year)?.length || 0))])
    .range([height, 0]);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  let yAxis = svg.append("g").call(d3.axisLeft(y));

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(states);
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

  function drawLines(filteredData, xScale, xDomain) {
    svg.selectAll(".line").remove();

    states.forEach(state => {
      const stateData = xDomain.map(xValue => ({
        xValue: xValue,
        count: filteredData.get(state).get(xValue)?.length || 0,
        injured: filteredData.get(state).get(xValue)?.reduce((sum, d) => sum + d.injured, 0) || 0,
        killed: filteredData.get(state).get(xValue)?.reduce((sum, d) => sum + d.killed, 0) || 0
      }));

      const line = svg.append("path")
        .datum(stateData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "darkgrey")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(d => xScale(d.xValue))
          .y(d => y(d.count))
        );

      line.on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "yellow").attr("stroke-width", 3);
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip.html(`State: ${state}<br>Total Incidents: ${d3.sum(stateData, d => d.count)}`)
          .style("left", (xPos + 70) + "px")
          .style("top", (yPos) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "darkgrey").attr("stroke-width", 1.5);
        tooltip.style("opacity", 0);
      });
    });
  }

  drawLines(nestedData, x, years);

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Year");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("Number of Incidents");

  xAxis.selectAll("text").style("cursor", "pointer")
    .on("click", function(event, year) {
      const filteredData = d3.group(data.filter(d => d.year === year), d => d.state, d => d.month);
      const months = Array.from(new Set(data.filter(d => d.year === year).map(d => d.month))).sort((a, b) => a - b);

      const xMonth = d3.scalePoint().domain(months).range([0, width]);
      xAxis.call(d3.axisBottom(xMonth).tickFormat(d => d3.timeFormat("%B")(new Date(2000, d - 1, 1))));
      y.domain([0, d3.max(states, state => d3.max(months, month => filteredData.get(state).get(month)?.length || 0))]);
      yAxis.transition().duration(1000).call(d3.axisLeft(y));

      drawLines(filteredData, xMonth, months);
      d3.select("#resetButton").style("display", "block");
    });

  d3.select(".LineChart").append("button").attr("id", "resetButton").text("Reset")
    .style("display", "none").on("click", function() { createLineChart(data); });
}