import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
import { createHexbinMap } from './charts/CreateHexbinMap';

let selectedStates = [];

function createCharts(data) {
  createLineChart(data);
  createScatterPlot(data);
  createHexbinMap(data);
}

export function initCharts() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/data.csv").then(data => {

    createCharts(data);

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}

function updateCharts() {
  // Load the CSV data
  d3.csv(process.env.PUBLIC_URL + "/data/data.csv").then(data => {

    // Filter out the selected states from the data
    const filteredData = data.filter(d => selectedStates.includes(d.state));

    createCharts(filteredData);

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}

export function selectState(state){
  if (!selectedStates.includes(state)) {
    selectedStates.push(state);
    updateCharts();
  } else if (selectedStates.length === 1) {
    selectedStates = [];
    initCharts();
  } else {
    selectedStates = selectedStates.filter(s => s !== state);
    updateCharts();
  }
}

export function singleState(state){
  if (selectedStates.length != 1) {
    selectedStates = [state];
    updateCharts();
  } else {
    selectedStates = [];
    initCharts();
  }
}