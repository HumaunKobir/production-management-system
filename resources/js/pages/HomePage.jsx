import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-nav">
          <h1>PMS</h1>
          <nav>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <Link to="/login" className="btn-primary">Admin Login</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Production Management System</h2>
          <p>
            Track raw materials, semi-finished products, and finished goods through every
            stage of manufacturing — with full batch traceability and real-time inventory.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary btn-lg">Go to Admin Panel</Link>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <h3>Key Features</h3>
        <div className="feature-grid">
          <div className="feature-card">
            <h4>Inventory Management</h4>
            <p>Independent inventory levels for raw materials, semi-finished, and finished products.</p>
          </div>
          <div className="feature-card">
            <h4>Batch Production</h4>
            <p>Execute production in batches with unique identifiers, quantities, and timestamps.</p>
          </div>
          <div className="feature-card">
            <h4>Full Traceability</h4>
            <p>Trace any finished product batch back to its semi-finished and raw material sources.</p>
          </div>
          <div className="feature-card">
            <h4>Event-Driven Processing</h4>
            <p>Asynchronous production processing via RabbitMQ for reliable inventory updates.</p>
          </div>
        </div>
      </section>

      <section id="workflow" className="workflow">
        <h3>Production Workflow</h3>
        <div className="workflow-steps">
          <div className="step">Raw Materials</div>
          <div className="arrow">→</div>
          <div className="step">Semi-Finished</div>
          <div className="arrow">→</div>
          <div className="step">Finished Products</div>
        </div>
        <p className="workflow-example">
          Example: Steel Sheets → Steel Rods → Steel Pipes
        </p>
      </section>

      <footer className="home-footer">
        <p>Production Management System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
