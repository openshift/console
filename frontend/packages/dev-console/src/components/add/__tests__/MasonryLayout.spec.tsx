import { act, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import AddCardSectionSkeleton from '../AddCardSectionSkeleton';
import { MasonryLayout } from '../layout/MasonryLayout';

// Mock ResizeObserver to trigger callbacks when elements are observed
interface MockResizeObserver extends ResizeObserver {
  triggerResize(): void;
}

// Keep track of all ResizeObserver instances for testing
const resizeObserverInstances: MockResizeObserver[] = [];

// Mock ResizeObserver implementation
const MockResizeObserverImpl = class implements MockResizeObserver {
  private callback: ResizeObserverCallback;

  private observedElements: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverInstances.push(this as MockResizeObserver);
  }

  observe = (element: Element) => {
    this.observedElements.add(element);
    // Trigger initial observation
    this.callback(
      [
        {
          target: element,
          contentRect: element.getBoundingClientRect(),
        } as ResizeObserverEntry,
      ],
      this as any,
    );
  };

  unobserve = (element: Element) => {
    this.observedElements.delete(element);
  };

  disconnect = () => {
    this.observedElements.clear();
    const index = resizeObserverInstances.indexOf(this as MockResizeObserver);
    if (index > -1) {
      resizeObserverInstances.splice(index, 1);
    }
  };

  // Helper method to trigger resize callbacks for testing
  triggerResize = () => {
    this.observedElements.forEach((element) => {
      this.callback(
        [
          {
            target: element,
            contentRect: element.getBoundingClientRect(),
          } as ResizeObserverEntry,
        ],
        this as any,
      );
    });
  };
};

global.ResizeObserver = MockResizeObserverImpl as any;

describe('Masonry Layout', () => {
  const setWidth = (width: number) => {
    window.HTMLElement.prototype.getBoundingClientRect = () =>
      ({
        width,
      } as DOMRect);
  };

  it('should render loading component if loading is true and LoadingComponent is defined', async () => {
    setWidth(1400);

    const { container } = renderWithProviders(
      <MasonryLayout columnWidth={300} loading LoadingComponent={AddCardSectionSkeleton}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Wait for width measurement and rendering to complete
    await waitFor(() => {
      // Should show 4 columns (Math.floor(1400 / 300))
      const columns = container.querySelectorAll('.odc-masonry-layout__column');
      expect(columns).toHaveLength(4);
    });

    // Should render 4 skeleton placeholders (one per column)
    const skeletons = container.querySelectorAll(
      '.odc-add-section-skeleton-placeholder__container',
    );
    expect(skeletons).toHaveLength(4);
  });

  it('should render children if loading is false', async () => {
    setWidth(1400);

    const { container } = renderWithProviders(
      <MasonryLayout columnWidth={300}>
        <div className="child">Child 1</div>
        <div className="child">Child 2</div>
        <div className="child">Child 3</div>
        <div className="child">Child 4</div>
        <div className="child">Child 5</div>
      </MasonryLayout>,
    );

    // Wait for width measurement and rendering to complete
    await waitFor(() => {
      // Should show 4 columns (Math.floor(1400 / 300))
      const columns = container.querySelectorAll('.odc-masonry-layout__column');
      expect(columns).toHaveLength(4);
    });

    // Should render all children
    const children = container.querySelectorAll('div.child');
    expect(children).toHaveLength(5);
  });

  it('should change columns if a resize event exceeds threshold', async () => {
    setWidth(1200);

    const { container } = renderWithProviders(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Wait for initial width measurement and rendering to complete
    await waitFor(() => {
      // Should show 4 columns initially
      const columns = container.querySelectorAll('.odc-masonry-layout__column');
      expect(columns).toHaveLength(4);
    });

    // Change the width and trigger ResizeObserver callbacks
    act(() => {
      setWidth(900);
      // Trigger all ResizeObserver instances to simulate container resize
      resizeObserverInstances.forEach((observer) => {
        observer.triggerResize();
      });
    });

    // Wait for resize to be processed and re-render to complete
    await waitFor(() => {
      // Should show 3 columns now (Math.floor(900 / 300))
      const columns = container.querySelectorAll('.odc-masonry-layout__column');
      expect(columns).toHaveLength(3);
    });
  });

  it('should not change columns if a resize event does not exceed threshold', async () => {
    setWidth(1200);

    const { container } = renderWithProviders(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Wait for initial width measurement and rendering to complete
    await waitFor(() => {
      // Should show 4 columns initially
      const columns = container.querySelectorAll('.odc-masonry-layout__column');
      expect(columns).toHaveLength(4);
    });

    act(() => {
      setWidth(1190);
      // Trigger all ResizeObserver instances to simulate container resize
      resizeObserverInstances.forEach((observer) => {
        observer.triggerResize();
      });
    });

    // Wait for debounce timeout to ensure resize handler completes
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should still show 4 columns because new width does not exceed threshold
    const columns = container.querySelectorAll('.odc-masonry-layout__column');
    expect(columns).toHaveLength(4);
  });
});
