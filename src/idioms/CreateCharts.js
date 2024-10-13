import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
// Import other chart creation functions here...

// Shared state object
const state = {
  selectedYear: null,
  selectedState: null,
};

// Function to trigger updates across charts when state changes
function updateCharts(data) {
  const filteredData = data.filter(d => {
    return (!state.selectedYear || d.year === state.selectedYear) &&
           (!state.selectedState || d.state === state.selectedState);
  });

  // Update all charts with the filtered data
  createLineChart(filteredData);
  createScatterPlot(filteredData);
  // Call other chart creation functions here, e.g., createScatterPlot(filteredData), etc.
}

export function createCharts() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/parsed_gun.csv").then(data => {
    // Filter out data where the year is 2013
    const filteredData = data.filter(d => +d.year !== 2013);

    // Initially render the charts with the full data
    updateCharts(filteredData);

    // Add interactivity: e.g., dropdowns for selecting state/year, or any other elements
    // When selection changes, update the shared state and re-render charts
    d3.select("#yearDropdown").on("change", function() {
      const selectedYear = d3.select(this).property("value");
      state.selectedYear = selectedYear ? +selectedYear : null; // Update state with selected year
      updateCharts(filteredData); // Re-render charts
    });

    d3.select("#stateDropdown").on("change", function() {
      const selectedState = d3.select(this).property("value");
      state.selectedState = selectedState ? selectedState : null; // Update state with selected state
      updateCharts(filteredData); // Re-render charts
    });
  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}