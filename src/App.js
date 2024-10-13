import React, { useEffect } from 'react';
import './App.css';
import { createCharts } from './idioms/CreateCharts'; // Import the init function for the visualizations

function App() {
  useEffect(() => {
    createCharts(); // Initialize the visualizations
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Gun Violence</h2>
        <h3>United States</h3>
        <ul>
          <li>Dashboard</li>
          <li>Settings</li>
          <li>Profile</li>
        </ul>
      </aside>
      <main className="dashboard">
        <div className="container large LineChart"></div>
        <div className="container small">Hexagon Map</div>
        <div className="container small ScatterPlot"></div>
      </main>
    </div>
  );
}

export default App;