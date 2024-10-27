import * as d3 from 'd3';
import { createLineChart } from './charts/CreateLineChart';
import { createScatterPlot } from './charts/CreateScatterPlot';
import { createHexbinMap } from './charts/CreateHexbinMap';
import { allStates } from './channels/MapStates';

var selectedStates = [];
var _start = 2014
var _end = 2018

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
      && parseInt(d.year) >= _start && parseInt(d.year) <= _end
    );
    
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
  } else if(selectedStates.length === 1){
    selectedStates=allStates;
  }
  else {
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
  _start = start;
  _end = end;
  updateCharts();
}