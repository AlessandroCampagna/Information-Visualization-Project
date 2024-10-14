import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
// Import other chart creation functions here...

export function createCharts() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/parsed_gun.csv").then(data => {
    // Filter out data where the year is 2013
    const filteredData = data.filter(d => +d.year !== 2013);

    // Create the charts
    createLineChart(filteredData);
    createScatterPlot(filteredData);

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}

