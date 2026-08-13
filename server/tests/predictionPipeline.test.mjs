import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  normalizePredictionPayload,
  validatePredictionPayload,
  buildPredictionLookupFilter,
  migratePredictionDocument,
} from '../services/predictionNormalizer.js';

test('normalizes legacy prediction payloads into the standardized shape', () => {
  const normalized = normalizePredictionPayload({
    fixtureId: 12345,
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    matchDate: '2026-08-08T20:00:00.000Z',
    prediction: 'Home Win',
    market: 'Home Win',
    confidence: 84,
    expectedScore: '2-1',
    probabilities: { homeWin: 62, draw: 22, awayWin: 16 },
    analysis: ['Strong home form'],
    qualityScore: 81,
  });

  assert.equal(normalized.fixtureId, 12345);
  assert.equal(normalized.prediction.market, 'Home Win');
  assert.equal(normalized.prediction.selection, 'Home Win');
  assert.equal(normalized.prediction.confidence, 84);
  assert.equal(normalized.expectedScore, '2-1');
  assert.equal(normalized.qualityScore, 81);
  assert.deepEqual(normalized.markets[0], { market: 'Home Win', probability: 62, confidence: 84 });
});

test('buildPredictionLookupFilter uses fixtureId for numeric ids and _id for ObjectIds', () => {
  const numericFilter = buildPredictionLookupFilter('12345');
  const objectId = new mongoose.Types.ObjectId().toString();
  const objectFilter = buildPredictionLookupFilter(objectId);

  assert.deepEqual(numericFilter, { fixtureId: 12345 });
  assert.deepEqual(objectFilter, { _id: objectId });
});

test('validatePredictionPayload rejects malformed payloads and duplicate fixture ids', () => {
  const missing = validatePredictionPayload({ homeTeam: 'A', awayTeam: 'B', league: 'L' });
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'fixtureId is required');

  const duplicate = validatePredictionPayload({ fixtureId: 77, homeTeam: 'A', awayTeam: 'B', league: 'L', prediction: { market: 'Home Win' } }, { existingFixtureIds: [77] });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error, 'fixtureId 77 already exists');
});

test('migratePredictionDocument standardizes legacy documents', () => {
  const migrated = migratePredictionDocument({
    _id: new mongoose.Types.ObjectId(),
    fixtureId: '999',
    homeTeam: 'Liverpool',
    awayTeam: 'Man Utd',
    league: 'Premier League',
    matchDate: '2026-08-08T18:30:00.000Z',
    prediction: 'Home Win',
    selectedMarket: 'Home Win',
    confidence: '87',
    expectedScore: '1-0',
    probabilities: { homeWin: 58, draw: 24, awayWin: 18 },
    analysis: ['Legacy analysis'],
    qualityScore: '90',
  });

  assert.equal(migrated.fixtureId, 999);
  assert.equal(migrated.prediction.market, 'Home Win');
  assert.equal(migrated.prediction.confidence, 87);
  assert.equal(migrated.qualityScore, 90);
  assert.equal(migrated.status, 'pending');
  assert.equal(migrated.matchDate instanceof Date, true);
});
