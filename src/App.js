import React, { useEffect } from 'react';
import './App.css';
import { createCharts } from './idioms/CreateCharts'; // Import the init function for the visualizations

function App() {
  useEffect(() => {
    createCharts(); // Initialize the visualizations
  }, []);

  return (
    <div className="app-container">
      <main className="dashboard">
        <div className="container large LineChart"></div>
        <div className="container small">
          <img src={process.env.PUBLIC_URL + "/map.png"} alt="Hexagon Map" className="hexagon-map" />
        </div>
        <div className="container small ScatterPlot"></div>
      </main>
    </div>
  );
}

export default App;