// src/init.js

import * as d3 from 'd3';
import { createLineChart } from './idioms/createLineChart'; // Line chart
// Add more imports here...

export function init() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/parsed_gun.csv").then(data => {
    // Filter out data where the year is 2013
    const filteredData = data.filter(d => +d.year !== 2013);

    // Initialize the visualizations
    createLineChart(filteredData);
    // Add more here...

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}