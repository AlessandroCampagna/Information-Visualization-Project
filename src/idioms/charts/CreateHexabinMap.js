import * as d3 from "d3";
import { hexbin as d3Hexbin } from "d3-hexbin";

export function createHexabinMap(data) {
  const width = 300;
  const height = 300;
  
  // Append the SVG to the HexabinMap container
  const svg = d3.select(".HexabinMap").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Map and projection
  const projection = d3.geoMercator()
    .scale(350) // This is the zoom
    .translate([550, 440]); // You have to play with these values to center your map

  // Path generator
  const path = d3.geoPath()
    .projection(projection);

  // Load external data and draw the map
  d3.json(process.env.PUBLIC_URL + "/data/us_states_hexgrid.geojson.json").then(mapData => {
    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(mapData.features)
      .enter()
      .append("path")
      .attr("fill", "#69a2a2")
      .attr("d", path)
      .attr("stroke", "white");

    // Add the labels
    svg.append("g")
      .selectAll("labels")
      .data(mapData.features)
      .enter()
      .append("text")
      .attr("x", d => path.centroid(d)[0])
      .attr("y", d => path.centroid(d)[1])
      .text(d => d.properties.iso3166_2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .style("font-size", 11)
      .style("fill", "white");

    // Create a separate group for the hexbin map
    const hexbinGroup = svg.append("g");

    // Create hexbin
    const hexbin = d3Hexbin()
      .radius(20)
      .extent([[0, 0], [width, height]]);

    const color = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, 20]);

    // Assuming you need to map specific data fields to x and y (adjust field names accordingly)
    const points = data.map(d => projection([+d.longitude, +d.latitude]));  // Example: Using 'longitude' and 'latitude'

    hexbinGroup.selectAll("path")
      .data(hexbin(points))
      .enter().append("path")
      .attr("d", hexbin.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", d => color(d.length))
      .attr("stroke", "black");
  });
}
