import * as d3 from "d3";
import { hexbin as d3Hexbin } from "d3-hexbin";

export function createHexabinMap(data) {
  // Select the container for the hexbin map
  const container = d3.select(".HexabinMap");

  // Clear any existing SVG elements
  container.selectAll("svg").remove();

  // The svg
  const svg = container.append("svg")
    .attr("width", container.node().clientWidth)
    .attr("height", container.node().clientHeight);

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Map and projection
  const projection = d3.geoMercator()
    .scale(450) // This is the zoom
    .translate([1200, 550]); // You have to play with these values to center your map

  // Path generator
  const path = d3.geoPath()
    .projection(projection);

  // Load external data and boot
  d3.json(process.env.PUBLIC_URL + "/data/us_states_hexgrid.geojson.json").then(function(data) {
    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(data.features)
      .join("path")
      .attr("fill", "#69a2a2")
      .attr("d", path)
      .attr("stroke", "white");

    // Add the labels
    svg.append("g")
      .selectAll("labels")
      .data(data.features)
      .join("text")
      .attr("x", function(d) { return path.centroid(d)[0]; })
      .attr("y", function(d) { return path.centroid(d)[1]; })
      .text(function(d) { return d.properties.iso3166_2; })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .style("font-size", 11)
      .style("fill", "white");
  });
}