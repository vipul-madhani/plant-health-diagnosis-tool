import React from 'react';

const ResultsPage = ({ diagnosisData, onNewDiagnosis }) => {
  if (!diagnosisData) {
    return (
      <div className="results-page">
        <p>No diagnosis data available</p>
      </div>
    );
  }

  const {
    plant_species,
    plant_species_confidence,
    diseases,
    treatments,
    preventive_measures,
    geo_aware_solutions,
    location,
  } = diagnosisData;

  return (
    <div className="results-page">
      <div className="results-container">
        <h1>Diagnosis Results</h1>

        {/* Plant Species Section */}
        <section className="results-section plant-species-section">
          <h2>Plant Identified</h2>
          <div className="result-card">
            <p className="species-name">{plant_species}</p>
            <p className="confidence-badge">
              Confidence: {(plant_species_confidence * 100).toFixed(2)}%
            </p>
          </div>
        </section>

        {/* Diseases Section */}
        {diseases && diseases.length > 0 && (
          <section className="results-section diseases-section">
            <h2>Detected Diseases/Issues</h2>
            {diseases.map((disease, index) => (
              <div key={index} className="disease-card">
                <h3>{disease.name}</h3>
                <p className="disease-severity">
                  Severity: <span className={`severity-${disease.severity}`}>{disease.severity}</span>
                </p>
                <p className="disease-description">{disease.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Treatments Section */}
        {treatments && treatments.length > 0 && (
          <section className="results-section treatments-section">
            <h2>Recommended Treatments</h2>
            {treatments.map((treatment, index) => (
              <div key={index} className="treatment-card">
                <h3>{treatment.name}</h3>
                <p className="treatment-type">{treatment.type}</p>
                <p className="treatment-description">{treatment.description}</p>
                {treatment.dosage && <p className="dosage">Dosage: {treatment.dosage}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Preventive Measures Section */}
        {preventive_measures && preventive_measures.length > 0 && (
          <section className="results-section preventive-section">
            <h2>Preventive Measures</h2>
            <ul className="measures-list">
              {preventive_measures.map((measure, index) => (
                <li key={index}>{measure}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Geo-Aware Solutions Section */}
        {geo_aware_solutions && geo_aware_solutions.length > 0 && (
          <section className="results-section geo-section">
            <h2>Geo-Aware Organic Solutions</h2>
            {location && <p className="location">Location: {location}</p>}
            {geo_aware_solutions.map((solution, index) => (
              <div key={index} className="solution-card">
                <h3>{solution.name}</h3>
                <p className="availability">Availability: {solution.availability}</p>
                <p className="description">{solution.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Action Buttons */}
        <div className="results-actions">
          <button onClick={onNewDiagnosis} className="new-diagnosis-button">
            Start New Diagnosis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
