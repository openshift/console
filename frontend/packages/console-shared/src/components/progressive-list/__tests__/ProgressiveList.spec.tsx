import type { ReactNode } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import ProgressiveList from '../ProgressiveList';
import ProgressiveListItem from '../ProgressiveListItem';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const DummyComponent: Snail.FCC = () => <div>Dummy Component</div>;
const BarComponent: Snail.FCC = () => <div>Bar Component</div>;
const FooComponent: Snail.FCC = () => <div>Foo Component</div>;

const Footer: Snail.FCC<{ children?: ReactNode }> = ({ children }) => {
  return <div>Click on the names to access advanced options for {children}.</div>;
};

describe('ProgressiveList', () => {
  it('should only display component related to item name mentioned in the visibleItems array', () => {
    renderWithProviders(
      <ProgressiveList Footer={Footer} visibleItems={['Bar', 'Foo']} onVisibleItemChange={() => {}}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
        <ProgressiveListItem name="Bar">
          <BarComponent />
        </ProgressiveListItem>
        <ProgressiveListItem name="Foo">
          <FooComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );

    expect(screen.getByText('Bar Component')).toBeVisible();
    expect(screen.getByText('Foo Component')).toBeVisible();
    expect(screen.queryByText('Dummy Component')).not.toBeInTheDocument();
  });

  it('should render footer with correct text for hidden items', () => {
    renderWithProviders(
      <ProgressiveList Footer={Footer} visibleItems={[]} onVisibleItemChange={() => {}}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );

    expect(screen.getByText(/Click on the names to access advanced options for/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dummy' })).toBeVisible();
  });

  it('clicking on a button should add that component related to it to visibleItems list', () => {
    const visibleItems: string[] = [];
    const callback = jest.fn((item: string) => {
      visibleItems.push(item);
    });

    const { rerender } = renderWithProviders(
      <ProgressiveList Footer={Footer} visibleItems={visibleItems} onVisibleItemChange={callback}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );

    expect(screen.getByRole('button', { name: 'Dummy' })).toBeVisible();
    expect(screen.queryByText('Dummy Component')).not.toBeInTheDocument();
    expect(visibleItems).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Dummy' }));

    expect(callback).toHaveBeenCalledWith('Dummy');
    expect(visibleItems).toHaveLength(1);
    expect(visibleItems.includes('Dummy')).toBe(true);

    // Re-render with updated visibleItems
    rerender(
      <ProgressiveList Footer={Footer} visibleItems={visibleItems} onVisibleItemChange={callback}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );

    expect(screen.getByText('Dummy Component')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Dummy' })).not.toBeInTheDocument();
  });
});
