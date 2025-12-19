import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import ProgressiveListFooter from '../ProgressiveListFooter';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const Footer: Snail.FCC<{ children?: ReactNode }> = ({ children }) => {
  return <div>Click on the names to access advanced options for {children}.</div>;
};

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
});
