import React, { useEffect, useState } from 'react';
import './App.css';
import { initCharts, setTimeRange } from './idioms/InitCharts';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

function App() {
  const [sliderValues, setSliderValues] = useState([0, 4]);

  useEffect(() => {
    initCharts(); // Initialize the visualizations
  }, []);

  const handleSliderChange = (values) => {
    setSliderValues(values);
    const startYear = 2014;
    const endYear = 2018;
    const modulatedValues = [
      startYear + Math.floor(values[0] / 4 * (endYear - startYear)),
      startYear + Math.floor(values[1] / 4 * (endYear - startYear))
    ];
    setTimeRange(modulatedValues[0], modulatedValues[1]);
  };

  return (
    <div className="app-container">
      <main className="dashboard">
        <div className='container navbar Navbar' id="navbar">
          <h1>Gun Violence in the United States</h1>
          <div className="slider-container">
            <div className="slider-legend">
              <span>2014</span>
              <span>2015</span>
              <span>2016</span>
              <span>2017</span>
              <span>2018</span>
            </div>
            <RangeSlider
              className="slider"
              min={0}
              max={4}
              defaultValue={[0, 4]}
              onInput={handleSliderChange}
            />
          </div>
        </div>
        <div className="container large LineChart" id="linechart"></div>
        <div className="container small HexbinMap" id="hexbinmap"></div>
        <div className="container small ScatterPlot" id="scatterplot"></div>
      </main>
    </div>
  );
}

export default App;