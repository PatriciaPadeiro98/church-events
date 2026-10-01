import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Event } from '../src/models/event.types.ts';
import { buildEventState } from '../src/pages/events/useEvents.ts';

const open: Event = { id: 'e1', name: 'Festa', date: '2026-05-31', status: 'open' };
const closed: Event = { id: 'e2', name: 'Antiga', date: '2026-05-01', status: 'closed' };
const deleted: Event = { id: 'e3', name: 'Apagada', date: '2026-04-01', status: 'deleted' };

describe('buildEventState', () => {
  it('returns empty state for empty event list', () => {
    const state = buildEventState([]);
    assert.deepEqual(state, { events: [], activeEventId: undefined });
  });

  it('selects the saved active event when it is still usable', () => {
    const state = buildEventState([open, closed], 'e2');
    assert.equal(state.activeEventId, 'e2');
  });

  it('falls back to an open event when saved id is not found', () => {
    const state = buildEventState([closed, open], 'missing-id');
    assert.equal(state.activeEventId, 'e1');
  });

  it('falls back to an open event when no active id is stored', () => {
    const state = buildEventState([closed, open]);
    assert.equal(state.activeEventId, 'e1');
  });

  it('falls back to any usable event when there is no open event', () => {
    const state = buildEventState([closed, deleted]);
    assert.equal(state.activeEventId, 'e2');
  });

  it('never selects a deleted event', () => {
    const state = buildEventState([deleted]);
    assert.equal(state.activeEventId, undefined);
  });

  it('ignores saved id pointing to a deleted event and picks next usable', () => {
    const state = buildEventState([deleted, closed], 'e3');
    assert.equal(state.activeEventId, 'e2');
  });

  it('preserves the full events list in state', () => {
    const events = [open, closed, deleted];
    const state = buildEventState(events);
    assert.equal(state.events, events);
  });
});
