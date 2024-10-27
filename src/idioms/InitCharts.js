import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
import { createHexbinMap } from './charts/CreateHexbinMap';
import { allStates } from './channels/MapStates';

let selectedStates = [];
let start = 2014
let end = 2018

function createCharts(data) {
  createLineChart(data);
  createScatterPlot(data);
  createHexbinMap(data);
}

export function initCharts() {
  selectedStates = allStates;

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
    const filteredData = data.filter(d =>
      selectedStates.includes(d.state) 
      && parseInt(d.year) >= start && parseInt(d.year) <= end
    );

    console.log(start, end, filteredData);
    
    createCharts(filteredData);

  }).catch(error => {
    console.error("Error loading the dataset:", error);
  });
}

export function selectState(state){
  if (selectedStates.length === allStates.length) {
    selectedStates = [state];
  } else if (!selectedStates.includes(state)) {
    selectedStates.push(state);
  } else {
    selectedStates = selectedStates.filter(s => s !== state);
  }

  updateCharts();
}

export function singleState(state){
  if (selectedStates.length !== 1) {
    selectedStates = [state];
  } else {
    selectedStates = allStates;
  }

  updateCharts();
}

export function setTimeRange(start, end){
  start = start;
  end = end;
  updateCharts();
}