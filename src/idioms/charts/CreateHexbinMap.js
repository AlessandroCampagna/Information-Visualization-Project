import * as d3 from "d3";
import { selectState } from "../InitCharts";
import { stateNameToAbbreviation } from "../channels/MapStates";
import * as color from  "../channels/Colors";

function addEventListeners(svg, stateIncidentCounts, colorScale, stateText) {
  window.addEventListener('highlightState', (event) => {
    const { state } = event.detail;
    const stateAbbreviation = stateNameToAbbreviation[state];
    svg.selectAll("path")
      .filter(d => d.properties.iso3166_2 === stateAbbreviation)
      .attr("fill", color.highlight);
  });

  window.addEventListener('removeHighlightState', (event) => {
    const { state } = event.detail;
    const stateAbbreviation = stateNameToAbbreviation[state];
    svg.selectAll("path")
      .filter(d => d.properties.iso3166_2 === stateAbbreviation)
      .attr("fill", d => {
        const incidentCount = stateIncidentCounts.get(state) || 0;
        return colorScale(incidentCount);
      });
  });
}

function addColorLegend(svg, colorScale) {

  // Add a text at the top of the map saying "USA"
  svg.append("text")
    .attr("x", svg.attr("width") / 1.94)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "40px")
    .style("font-family", "Arial, sans-serif")
    .text("USA");

  // Legend dimensions
  const legendHeight = 200;
  const legendWidth = 25;
  const legendPadding = 50;

  // Legend scale (now vertical)
  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([legendHeight, 0]);

  // Create a legend group
  const legendGroup = svg.append("g")
    .attr("class", "color-legend")
    .attr("transform", `translate(${+svg.attr("width") - legendWidth - legendPadding}, ${svg.attr("height") / 2 - legendHeight / 2})`);

  // Add a gradient rectangle for the legend color scale
  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legendGradient)")
    .style("stroke", "black")
    .style("stroke-width", 1);

  // Create a gradient definition for the color scale
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legendGradient")
    .attr("x1", "0%").attr("x2", "0%") // Vertical gradient
    .attr("y1", "100%").attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data(colorScale.ticks().map((t, i, n) => ({
      offset: `${(100 * i) / (n.length - 1)}%`,
      color: colorScale(t)
    })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  // Add legend scale labels
  legendGroup.call(d3.axisLeft(legendScale)
    .tickSize(10)
    .ticks(5))
    .select(".domain").remove();  // Remove the axis line
}


export function createHexbinMap(data) {
  // Select the container for the hexbin map
  const container = d3.select(".HexbinMap");

  // Check if the container exists
  if (container.empty()) {
    console.error("Container with class 'HexbinMap' not found.");
    return;
  }

  // Clear any existing SVG elements
  container.selectAll("svg").remove();

  // The svg
  const svg = container.append("svg")
    .attr("width", container.node().clientWidth)
    .attr("height", container.node().clientHeight);

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Check if the dimensions are valid
  if (width === 0 || height === 0) {
    console.error("Container has zero width or height.");
    return;
  }

  // Create a tooltip element
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("display", "none");

  // Map and projection
  const projection = d3.geoMercator()
    .scale(450) // This is the zoom
    .translate([1200, 550]); // You have to play with these values to center your map

  // Path generator
  const path = d3.geoPath()
    .projection(projection);

  // Calculate the total number of incidents for each state
  const stateIncidentCounts = d3.rollup(data, v => v.length, d => d.state);

  // Create a color scale
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, 20000]);

  // Add text element to display state name
  const stateText = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("fill", "black");

  // Load external data and boot
  d3.json(process.env.PUBLIC_URL + "/data/hexgrid.geojson.json").then(function(geoData) {
    if (!geoData) {
      console.error("Failed to load GeoJSON data.");
      return;
    }

    // Calculate the bounds of the geoData
    const bounds = d3.geoBounds(geoData);
    const center = d3.geoCentroid(geoData);
    const distance = d3.geoDistance(bounds[0], bounds[1]);
    const scale = (width / distance) * 0.5; // Adjust scale factor as needed

    // Update the projection with the new scale and center
    projection
      .scale(scale)
      .center(center)
      .translate([width / 2, height / 2]);

      svg.append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("fill", d => {
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        return incidentCount === 0 ? "#cccccc" : colorScale(incidentCount); // Set color to gray if incidentCount is 0
      })
      .attr("d", path)
      .attr("stroke", "black")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", color.highlight); // Change color on hover
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        tooltip.style("display", "block")
          .html(`<strong>${stateName}</strong><br>Incidents: ${incidentCount}`);
        const highlightEvent = new CustomEvent('highlightState', { detail: { stateAbbreviation } });
        window.dispatchEvent(highlightEvent);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function(event, d) {
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        d3.select(this).attr("fill", incidentCount === 0 ? "#cccccc" : colorScale(incidentCount)); // Revert color to gray if incidentCount is 0
        tooltip.style("display", "none");
        const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { stateAbbreviation } });
        window.dispatchEvent(removeHighlightEvent);
      })
      .on("click", function(event, d) {
        selectState(Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === d.properties.iso3166_2));
        tooltip.style("display", "none");
      });
    
    // Add the labels
    svg.append("g")
      .selectAll("labels")
      .data(geoData.features)
      .join("text")
      .attr("x", function(d) { return path.centroid(d)[0]; })
      .attr("y", function(d) { return path.centroid(d)[1]; })
      .text(function(d) { return d.properties.iso3166_2; })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .style("font-size", 11)
      .style("fill", function(d) {
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        const fillColor = colorScale(incidentCount);
        const rgb = d3.color(fillColor).rgb();
        const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        return luminance < 130 ? "white" : "black";
      })
      .style("pointer-events", "none"); // Make labels hollow, allowing selection of elements underneath


      addColorLegend(svg, colorScale)
  }).catch(function(error) {
    console.error("Error loading GeoJSON data:", error);
  });

  addEventListeners(svg, stateIncidentCounts, colorScale, stateText);
}