import { sortEvents, typeFilter } from '../events';

const createMockEvent = (namespace: string, name: string, uid: string, lastTimestamp: string) => ({
  metadata: {
    uid,
    name,
    namespace,
    resourceVersion: '1',
  },
  involvedObject: {
    kind: 'Pod',
    name: `${name}-pod`,
    namespace,
  },
  source: {
    component: 'test-component',
  },
  type: 'Normal',
  reason: 'Created',
  message: `Created pod ${name}-pod`,
  lastTimestamp,
});

describe('Event utility functions', () => {
  describe('sortEvents', () => {
    it('returns events ordered by lastTimestamp in descending order', () => {
      const events = [
        createMockEvent('ns1', 'event1', 'uid1', '2025-12-10T10:00:00Z'),
        createMockEvent('ns1', 'event2', 'uid2', '2025-12-10T12:00:00Z'),
        createMockEvent('ns1', 'event3', 'uid3', '2025-12-10T11:00:00Z'),
      ];

      const sorted = sortEvents(events);

      expect(sorted[0].metadata.name).toBe('event2');
      expect(sorted[1].metadata.name).toBe('event3');
      expect(sorted[2].metadata.name).toBe('event1');
    });

    it('sorts events by timestamp regardless of namespace', () => {
      const events = [
        createMockEvent('project-a', 'event-a', 'uid-a', '2025-12-10T10:00:00Z'),
        createMockEvent('project-b', 'event-b', 'uid-b', '2025-12-10T12:00:00Z'),
      ];

      const sorted = sortEvents(events);

      expect(sorted[0].metadata.namespace).toBe('project-b');
      expect(sorted[1].metadata.namespace).toBe('project-a');
    });
  });

  describe('typeFilter', () => {
    it('returns true for "all" filter with any event type', () => {
      const normalEvent = {
        ...createMockEvent('ns', 'event', 'uid', '2025-12-10T10:00:00Z'),
        type: 'Normal',
      };
      const warningEvent = {
        ...createMockEvent('ns', 'event', 'uid', '2025-12-10T10:00:00Z'),
        type: 'Warning',
      };

      expect(typeFilter('all', normalEvent)).toBe(true);
      expect(typeFilter('all', warningEvent)).toBe(true);
    });

    it('returns true only for matching event types', () => {
      const normalEvent = {
        ...createMockEvent('ns', 'event', 'uid', '2025-12-10T10:00:00Z'),
        type: 'Normal',
      };
      const warningEvent = {
        ...createMockEvent('ns', 'event', 'uid', '2025-12-10T10:00:00Z'),
        type: 'Warning',
      };

      expect(typeFilter('normal', normalEvent)).toBe(true);
      expect(typeFilter('normal', warningEvent)).toBe(false);

      expect(typeFilter('warning', normalEvent)).toBe(false);
      expect(typeFilter('warning', warningEvent)).toBe(true);
    });

    it('treats events without type property as normal type', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
      const { type: _ignored, ...eventWithoutType } = createMockEvent(
        'ns',
        'event',
        'uid',
        '2025-12-10T10:00:00Z',
      );

      expect(typeFilter('normal', eventWithoutType)).toBe(true);
      expect(typeFilter('warning', eventWithoutType)).toBe(false);
    });
  });

  describe('Integration with namespace filtering', () => {
    it('returns events sorted by timestamp across multiple namespaces', () => {
      const events = [
        createMockEvent('project-a', 'event-a1', 'uid-a1', '2025-12-10T10:00:00Z'),
        createMockEvent('project-b', 'event-b1', 'uid-b1', '2025-12-10T12:00:00Z'),
        createMockEvent('project-a', 'event-a2', 'uid-a2', '2025-12-10T11:00:00Z'),
      ];

      const sorted = sortEvents(events);

      expect(sorted[0].metadata.name).toBe('event-b1');
      expect(sorted[1].metadata.name).toBe('event-a2');
      expect(sorted[2].metadata.name).toBe('event-a1');
    });

    it('can be filtered by namespace while preserving sort order', () => {
      const allEvents = [
        createMockEvent('project-a', 'event-a1', 'uid-a1', '2025-12-10T10:00:00Z'),
        createMockEvent('project-b', 'event-b1', 'uid-b1', '2025-12-10T12:00:00Z'),
        createMockEvent('project-a', 'event-a2', 'uid-a2', '2025-12-10T11:00:00Z'),
      ];

      const sorted = sortEvents(allEvents);
      const selectedNamespace = 'project-a';
      const filteredEvents = sorted.filter((e) => e.metadata.namespace === selectedNamespace);

      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents[0].metadata.name).toBe('event-a2');
      expect(filteredEvents[1].metadata.name).toBe('event-a1');
      expect(filteredEvents.every((e) => e.metadata.namespace === 'project-a')).toBe(true);
    });

    it('returns different results when namespace filter changes', () => {
      const allEvents = [
        createMockEvent('project-a', 'event-a1', 'uid-a1', '2025-12-10T10:00:00Z'),
        createMockEvent('project-b', 'event-b1', 'uid-b1', '2025-12-10T12:00:00Z'),
      ];

      const sorted = sortEvents(allEvents);

      let selectedNamespace = 'project-a';
      let filteredEvents = sorted.filter((e) => e.metadata.namespace === selectedNamespace);
      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].metadata.name).toBe('event-a1');

      selectedNamespace = 'project-b';
      filteredEvents = sorted.filter((e) => e.metadata.namespace === selectedNamespace);

      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].metadata.name).toBe('event-b1');
      expect(filteredEvents[0].metadata.namespace).toBe('project-b');
    });
  });
});
