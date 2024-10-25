import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
import { createHexbinMap } from './charts/CreateHexbinMap';

export function createCharts() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/data.csv").then(data => {

    createLineChart(data);
    createScatterPlot(data);
    createHexbinMap(data);

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}

