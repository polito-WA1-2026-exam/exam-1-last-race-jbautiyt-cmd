// ─── ExecutionPage — Phase 3: Execution ──────────────────────────────────────
// Shows the execution steps one by one.
// For each segment of the route, it shows the random event that occurred
// and the effect it had on the player's coins.
// If the route was invalid, it shows the penalty directly (0 coins).

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function ExecutionPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [stepData, setStepData] = useState(null);
  const [error, setError] = useState('');

  // Fetches the current execution step from the server
  async function loadStep() {
    try {
      const data = await api.getExecutionStep(gameId);
      setStepData(data);
      if (data.done) {
        await api.advancePhase(gameId, 'result').catch(() => {});
        setTimeout(() => navigate(`/game/result/${gameId}`), 1500);
      }
    } catch {
      setError('Error during execution.');
    }
  }

  // Load the first step when the component mounts
  useEffect(() => {
    loadStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleNext = async () => {
    try {
      const res = await api.nextExecutionStep(gameId);
      if (res.done) {
        navigate(`/game/result/${gameId}`);
      } else {
        loadStep();
      }
    } catch {
      setError('Unable to move to the next step.');
    }
  };

  if (error) return <p className="error-msg">{error}</p>;
  if (!stepData) return <p className="status-msg">Starting execution...</p>;

  if (stepData.invalidRoute) {
    return (
      <section className="page game-page">
        <h1>Phase 3 — Execution</h1>
        <p className="error-msg">{stepData.message}</p>
        <p>Final score: 0 coins.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate(`/game/result/${gameId}`)}
        >
          View result
        </button>
      </section>
    );
  }

  if (stepData.done) {
    return (
      <section className="page game-page">
        <h1>Phase 3 — Execution complete</h1>
        <p>Final coins: {stepData.coins}</p>
        <p>Score: {stepData.score}</p>
      </section>
    );
  }

  const { step, stepIndex, totalSteps, coins } = stepData;

  return (
    <section className="page game-page">
      <h1>Phase 3 — Execution</h1>
      <p>
        Segment {stepIndex + 1} of {totalSteps}:{' '}
        <strong>
          {step.fromStation.name} &rarr; {step.toStation.name}
        </strong>
      </p>
      <div className="event-card">
        <h2>Unexpected event</h2>
        <p>{step.event.description}</p>
        <p>
          Effect: {step.event.effect >= 0 ? '+' : ''}
          {step.event.effect} coins
        </p>
      </div>
      <p className="coins-display">
        Current coins: <strong>{coins}</strong>
      </p>
      <button type="button" className="btn-primary" onClick={handleNext}>
        {stepIndex + 1 >= totalSteps ? 'View result' : 'Next segment'}
      </button>
    </section>
  );
}