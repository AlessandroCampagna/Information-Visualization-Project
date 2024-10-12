import './App.css';

function App() {
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
        <div className="container large">Top Container</div>
        <div className="container small">Bottom Left</div>
        <div className="container small">Bottom Right</div>
      </main>
    </div>
  );
}

export default App;