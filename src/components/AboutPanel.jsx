function AboutPanel({ onBack }) {
  return (
    <section className="about-shell" aria-labelledby="about-title">
      <div className="results-page-header">
        <div>
          <p className="eyebrow">About FundWise Rural</p>
          <h2 id="about-title">What this product is designed to do</h2>
          <p className="panel-copy">
            FundWise Rural helps rural businesses understand which EU funding route may fit their project
            before they navigate official programme websites. The tool combines business profile
            information, regional programme logic, and AI-assisted interpretation to highlight likely
            CAP and ERDF pathways. It is designed to save time, reduce confusion, and help applicants
            prepare stronger first-step materials before moving to the official application route.
          </p>
        </div>
        <div className="results-header-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back to intake
          </button>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <strong>Purpose</strong>
          <p>
            The tool helps applicants navigate CAP, ERDF, and wider EU-level funding opportunities
            with clearer first-step guidance.
          </p>
        </div>
        <div className="about-card">
          <strong>How it works</strong>
          <p>
            It combines profile inputs, region-aware programme logic, and AI-assisted interpretation
            to surface stronger funding routes and explain why they fit.
          </p>
        </div>
        <div className="about-card">
          <strong>What users can do</strong>
          <p>
            Users can compare funding routes, save recommendations, prepare an application, reopen
            active cases through a dashboard, and follow progress through a secure workflow.
          </p>
        </div>
        <div className="about-card">
          <strong>Who it supports</strong>
          <p>
            The product supports rural business owners, returning applicants, and programme officers
            managing reviews, stage updates, and missing-information checks.
          </p>
        </div>
        <div className="about-card">
          <strong>Why it matters</strong>
          <p>
            Rural funding systems are often fragmented across regional, national, and EU levels. This
            prototype reduces confusion and helps applicants prepare more confidently.
          </p>
        </div>
        <div className="about-card">
          <strong>Product stance</strong>
          <p>
            FundWise Rural is a prototype decision-support tool. Official eligibility and funding
            decisions still rest with the responsible public bodies.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutPanel;
