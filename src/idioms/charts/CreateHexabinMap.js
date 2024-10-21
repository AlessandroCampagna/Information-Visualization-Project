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

export function createHexabinMap(data) {
  // Select the container for the hexbin map
  const container = d3.select(".HexabinMap");

  // Check if the container exists
  if (container.empty()) {
    console.error("Container with class 'HexabinMap' not found.");
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
    .domain([0, d3.max(stateIncidentCounts.values())]);

  // Load external data and boot
  d3.json(process.env.PUBLIC_URL + "/data/us_states_hexgrid.geojson.json").then(function(geoData) {
    if (!geoData) {
      console.error("Failed to load GeoJSON data.");
      return;
    }

    const highlightColor = "#ffcc00"; // A bright orange for the hover highlight

    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("fill", d => {
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        return colorScale(incidentCount);
      })
      .attr("d", path)
      .attr("stroke", "white")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", highlightColor); // Change color on hover
        const stateAbbreviation = d.properties.iso3166_2;
        const highlightEvent = new CustomEvent('highlightState', { detail: { stateAbbreviation } });
        window.dispatchEvent(highlightEvent);
      })
      .on("mouseout", function(event, d) {
        const stateAbbreviation = d.properties.iso3166_2;
        const stateName = Object.keys(stateNameToAbbreviation).find(key => stateNameToAbbreviation[key] === stateAbbreviation);
        const incidentCount = stateIncidentCounts.get(stateName) || 0;
        d3.select(this).attr("fill", colorScale(incidentCount)); // Revert color on mouse out
        const removeHighlightEvent = new CustomEvent('removeHighlightState', { detail: { stateAbbreviation } });
        window.dispatchEvent(removeHighlightEvent);
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
      .style("fill", "white");

  }).catch(function(error) {
    console.error("Error loading GeoJSON data:", error);
  });
}