// src/App.js

import React, { useEffect } from 'react';
import './App.css';
import { init } from './Init'; // Import the init function for the visualizations

function App() {
  useEffect(() => {
    // Call the init function to load data and render visualizations
    init();
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Sidebar</h2>
        <ul>
          <li>Dashboard</li>
          <li>Settings</li>
          <li>Profile</li>
        </ul>
      </aside>
      <main className="dashboard">
        <div className="container large LineChart">Top Container</div>
        <div className="container small">Bottom Left</div>
        <div className="container small">Bottom Right</div>
      </main>
    </div>
  );
}

export default App;