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
});
