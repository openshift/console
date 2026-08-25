import type { FC, ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { ProgressiveListFooter } from '../ProgressiveListFooter';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const Footer: FC<{ children?: ReactNode }> = ({ children }) => (
  <div>Click on the names to access advanced options for {children}.</div>
);

describe('ProgressiveListFooter', () => {
  it('should return JSX element if items array is not empty', () => {
    renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo']} onShowItem={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Foo' })).toBeInTheDocument();
  });

  it('should return null if items array is empty', () => {
    renderWithProviders(<ProgressiveListFooter Footer={Footer} items={[]} onShowItem={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should generate correct text', () => {
    const { container } = renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Bar', 'One']} onShowItem={() => {}} />,
    );

    expect(container.textContent).toBe(
      'Click on the names to access advanced options for Foo, Bar, and One.',
    );
  });

  it('should have number of button equals to items in array', () => {
    renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Bar', 'One']} onShowItem={() => {}} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('should render duplicate item labels with correct conjunction text', () => {
    const { container } = renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Foo']} onShowItem={() => {}} />,
    );

    expect(container.textContent).toBe(
      'Click on the names to access advanced options for Foo and Foo.',
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Foo');
    expect(buttons[1]).toHaveTextContent('Foo');
  });

  it('should render items matching the conjunction literal correctly', () => {
    const { container } = renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'and']} onShowItem={() => {}} />,
    );

    expect(container.textContent).toBe(
      'Click on the names to access advanced options for Foo and and.',
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Foo');
    expect(buttons[1]).toHaveTextContent('and');
  });

  it('should call onShowItem with the correct item for duplicate labels', () => {
    const onShowItem = jest.fn();
    renderWithProviders(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Foo']} onShowItem={onShowItem} />,
    );

    const buttons = screen.getAllByRole('button');
    buttons[1].click();
    expect(onShowItem).toHaveBeenCalledWith('Foo');
  });
});
