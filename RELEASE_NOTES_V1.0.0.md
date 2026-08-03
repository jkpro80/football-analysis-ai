# Football Analysis AI — V1.0.0

Release date: 2026-08-03

## Production Stack

- FastAPI Backend
- PostgreSQL
- SQLAlchemy
- Alembic
- Next.js Frontend
- Nginx
- Docker Compose

## Core Features

- Match and team data synchronization
- Upcoming and finished match pages
- Prediction Engine V11
- Expected-goals calculation
- Poisson score probabilities
- 1X2 probabilities
- Over/Under markets
- Both Teams to Score markets
- Exact-score predictions
- Prediction confidence
- Prediction record persistence
- Automatic evaluation after completed matches

## Self-Learning Infrastructure

- PredictionEvaluationService supports V11
- AutoCalibrationService supports V11
- ModelTuningService supports V11 and V11.1
- model_weights_v11.json persistent storage
- Safe dynamic weight loader
- Neutral fallback when weights are missing, disabled, or invalid
- Calibration threshold: 30 evaluated predictions
- Generated V11.1 weights remain disabled until reviewed

## Current Learning Status

- Evaluated V11 predictions: 0
- Calibration status: waiting_for_samples
- Tuning status: waiting_for_calibration
- Active calibration weights: disabled

## Deferred to V1.1

- V11 versus V11.1 A/B testing
- Automatic candidate approval
- Automatic activation
- Weight version history
- Automatic rollback
- Historical feature snapshots
