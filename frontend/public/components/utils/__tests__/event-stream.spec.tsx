import { render, screen, within } from '@testing-library/react';
import type { EventKind } from '../../../module/k8s';
import { EventStreamList } from '../event-stream';

jest.mock('../dom-utils', () => ({
  WithScrollContainer: ({ children }: { children: (el: HTMLElement) => React.ReactNode }) =>
    children(document.body),
}));

const createEvent = (name: string): EventKind =>
  ({
    metadata: { uid: `uid-${name}`, name, namespace: 'default', resourceVersion: '1' },
    involvedObject: { kind: 'Pod', name: `${name}-pod`, namespace: 'default' },
    source: { component: 'test-component' },
    type: 'Normal',
    reason: 'Created',
    message: `Created pod ${name}`,
    lastTimestamp: '2026-10-21T10:00:00Z',
  }) as EventKind;

describe('EventStreamList', () => {
  const ROW_HEIGHT = 100;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return ROW_HEIGHT;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 500;
      },
    });
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 733,
      top: 0,
      left: 0,
      bottom: 733,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  it('renders rows that CellMeasurer measures with non-zero height', () => {
    const events = [createEvent('event-1'), createEvent('event-2'), createEvent('event-3')];

    render(<EventStreamList events={events} EventComponent={() => <div>event</div>} />);

    const grid = screen.getByRole('grid');
    const rows = within(grid).getAllByText('event');
    expect(rows.length).toBe(events.length);

    // eslint-disable-next-line testing-library/no-node-access
    const inner = grid.querySelector('.ReactVirtualized__Grid__innerScrollContainer');
    expect(inner).not.toBeNull();
    expect((inner as HTMLElement).style.height).toBe(`${events.length * ROW_HEIGHT}px`);
  });

  it('does not rerender row content when CellMeasurer recreates its ref', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];
    const renderCount = { current: 0 };
    const EventComponent = () => {
      renderCount.current += 1;
      return <div>event</div>;
    };

    const { rerender } = render(
      <EventStreamList events={events} className="a" EventComponent={EventComponent} />,
    );
    const initialCount = renderCount.current;
    expect(initialCount).toBeGreaterThan(0);

    // Same events array, so the measurement cache is not cleared and row styles
    // are unchanged. CellMeasurer still recreates its callback ref on each
    // render, which must not defeat the memo on the row content — only the
    // thin ref-forwarding wrapper re-renders.
    rerender(<EventStreamList events={events} className="b" EventComponent={EventComponent} />);

    expect(renderCount.current).toBe(initialCount);
  });

  it('does not rerender unchanged row content while streaming', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];
    const renderCount = { current: 0 };
    const EventComponent = () => {
      renderCount.current += 1;
      return <div>event</div>;
    };

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={EventComponent} />,
    );
    const initialCount = renderCount.current;
    expect(initialCount).toBeGreaterThan(0);

    // Simulate a streaming update: the same events in a new array. The effect
    // clears the measurement cache and recomputes row heights, transiently
    // rewriting row styles, which must not rerender unchanged row content.
    rerender(<EventStreamList events={[...events]} EventComponent={EventComponent} />);

    expect(renderCount.current).toBe(initialCount);
  });

  it('rerenders only row content whose event changed', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];
    const renderCounts: Record<string, number> = {};
    const EventComponent = ({ event }: { event: EventKind }) => {
      const { name } = event.metadata;
      renderCounts[name] = (renderCounts[name] ?? 0) + 1;
      return <div>event</div>;
    };

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={EventComponent} />,
    );
    const initialCounts = { ...renderCounts };
    expect(initialCounts['event-1']).toBeGreaterThan(0);

    // Only the second event's lastTimestamp changes, so only its row content
    // should rerender.
    const updated = events.map((event, i) =>
      i === 1 ? { ...event, lastTimestamp: '2026-10-21T12:00:00Z' } : event,
    );
    rerender(<EventStreamList events={updated} EventComponent={EventComponent} />);

    expect(renderCounts['event-1']).toBe(initialCounts['event-1']);
    expect(renderCounts['event-2']).toBe(initialCounts['event-2'] + 1);
  });

  it('renders a replacement event at an existing index even when its lastTimestamp matches', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];
    const EventComponent = ({ event }: { event: EventKind }) => <div>{event.metadata.name}</div>;

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={EventComponent} />,
    );
    expect(screen.getByText('event-1')).toBeInTheDocument();

    // A distinct event with the same lastTimestamp takes over index 0; the row
    // must show the new event rather than the memoized previous content.
    const replacement = { ...createEvent('event-3'), lastTimestamp: events[0].lastTimestamp };
    rerender(<EventStreamList events={[replacement, events[1]]} EventComponent={EventComponent} />);

    expect(screen.getByText('event-3')).toBeInTheDocument();
    expect(screen.queryByText('event-1')).not.toBeInTheDocument();
  });

  it('keeps the slide-in class on animating rows across rerenders', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={() => <div>event</div>} />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const firstRow = document.querySelector('.co-sysevent--transition');
    expect(firstRow).not.toBeNull();
    expect(firstRow.classList.contains('co-sysevent-slide-in')).toBe(true);

    // CellMeasurer rerenders rows with a new ref on every pass; the animation
    // decision must be stable for the mounted row rather than recomputed from
    // the seen set, which would drop the class mid-animation.
    rerender(<EventStreamList events={events} EventComponent={() => <div>event</div>} />);

    expect(firstRow.classList.contains('co-sysevent-slide-in')).toBe(true);
  });

  it('animates a new event streaming into an existing row index', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={() => <div>event</div>} />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const firstRow = document.querySelector('.co-sysevent--transition');
    expect(firstRow.classList.contains('co-sysevent-slide-in')).toBe(true);

    // A new event streams in at the top; the row at index 0 is reused, so the
    // animation decision must be recomputed for the new event's UID.
    rerender(
      <EventStreamList
        events={[createEvent('event-0'), ...events]}
        EventComponent={() => <div>event</div>}
      />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const newRow = document.querySelector('.co-sysevent--transition');
    expect(newRow.classList.contains('co-sysevent-slide-in')).toBe(true);
  });

  it('does not re-animate an event that shifts to a new row index', () => {
    const events = [createEvent('event-1'), createEvent('event-2')];

    const { rerender } = render(
      <EventStreamList events={events} EventComponent={() => <div>event</div>} />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const firstRow = document.querySelector('.co-sysevent--transition');
    expect(firstRow.classList.contains('co-sysevent-slide-in')).toBe(true);

    // event-1 shifts from index 0 to index 1 when a new event streams in. It
    // has already been seen, so its remounted row must not animate again.
    rerender(
      <EventStreamList
        events={[createEvent('event-0'), ...events]}
        EventComponent={() => <div>event</div>}
      />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const shiftedRow = document.querySelectorAll('.co-sysevent--transition')[1];
    expect(shiftedRow.classList.contains('co-sysevent-slide-in')).toBe(false);
  });
});
