// ─── ExecutionPage — Phase 3: Execution ──────────────────────────────────────
// Shows the execution steps one by one.
// For each segment of the route, it shows the random event that occurred
// and the effect it had on the player's coins.
// If the route was invalid, it shows the penalty directly (0 coins).

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function ExecutionPage() {
  const { gameId } = useParams();  // game id from the URL
  const navigate = useNavigate();

  const [stepData, setStepData] = useState(null); // current step data returned by the server
  const [error, setError] = useState('');

  // Fetches the current execution step from the server
  async function loadStep() {
    try {
      const data = await api.getExecutionStep(gameId); // GET /api/games/:id/execution-step
      setStepData(data); // store the step in state to render it

      if (data.done) {
        // Execution is complete (all steps processed, or invalid route)
        await api.advancePhase(gameId, 'result').catch(() => {}); // advance the phase in the DB
        // Wait 1.5 seconds so the player sees the final message before redirecting
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
  }, [gameId]); // [gameId] = only load once (gameId does not change during execution)

  // Advance to the next step when the player clicks "Next segment"
  const handleNext = async () => {
    try {
      const res = await api.nextExecutionStep(gameId); // POST: increments execution_index in the DB

      if (res.done) {
        // No more steps → navigate directly to the result
        navigate(`/game/result/${gameId}`);
      } else {
        // More steps remaining → load the new current step from the server
        loadStep();
      }
    } catch {
      setError('Unable to move to the next step.');
    }
  };

  if (error) return <p className="error-msg">{error}</p>;
  if (!stepData) return <p className="status-msg">Starting execution...</p>;

  // Special case: route was invalid → full penalty
  if (stepData.invalidRoute) {
    return (
      <section className="page game-page">
        <h1>Phase 3 — Execution</h1>
        <p className="error-msg">{stepData.message}</p> {/* "Invalid route: you lose all your coins" */}
        <p>Final score: 0 coins.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate(`/game/result/${gameId}`)} // go directly to the result
        >
          View result
        </button>
      </section>
    );
  }

  // Case: all steps completed (done: true, invalidRoute: false)
  if (stepData.done) {
    return (
      <section className="page game-page">
        <h1>Phase 3 — Execution complete</h1>
        <p>Final coins: {stepData.coins}</p>
        <p>Score: {stepData.score}</p>
        {/* Automatic redirect to the result happens 1.5s after done: true (see loadStep) */}
      </section>
    );
  }

  // Normal case: there is an active step to show
  const { step, stepIndex, totalSteps, coins } = stepData;

  return (
    <section className="page game-page">
      <h1>Phase 3 — Execution</h1>

      {/* Shows which segment is being processed now */}
      <p>
        Segment {stepIndex + 1} of {totalSteps}:{' '} {/* +1 because stepIndex is 0-based */}
        <strong>
          {step.fromStation.name} → {step.toStation.name}
        </strong>
      </p>

      {/* Random event card */}
      <div className="event-card">
        <h2>Unexpected event</h2>
        <p>{step.event.description}</p> {/* e.g. "Wrong platform, you lose time" */}
        <p>
          Effect: {step.event.effect >= 0 ? '+' : ''} {/* manually add '+' if positive */}
          {step.event.effect} coins
        </p>
      </div>

      {/* Current coins (accumulated up to this step) */}
      <p className="coins-display">
        Current coins: <strong>{coins}</strong>
      </p>

      {/* Button text changes depending on whether this is the last step or not */}
      <button type="button" className="btn-primary" onClick={handleNext}>
        {stepIndex + 1 >= totalSteps ? 'View result' : 'Next segment'}
      </button>
    </section>
  );
}
