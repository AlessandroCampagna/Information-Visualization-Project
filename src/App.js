import React, { useEffect } from 'react';
import './App.css';
import { initCharts } from './idioms/InitCharts'; // Import the init function for the visualizations

function App() {
  useEffect(() => {
    initCharts(); // Initialize the visualizations
  }, []);

  return (
    <div className="app-container">
      <main className="dashboard">
        <div className="container large LineChart"></div>
        <div className="container small HexbinMap"></div>
        <div className="container small ScatterPlot"></div>
      </main>
    </div>
  );
}

export default App;