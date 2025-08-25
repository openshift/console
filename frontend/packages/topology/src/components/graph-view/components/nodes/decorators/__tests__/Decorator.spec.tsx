import { SVGDefsProvider } from '@patternfly/react-topology';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import Decorator from '../Decorator';
import '@testing-library/jest-dom';

describe('Decorator', () => {
  const renderInSvg = (ui: React.ReactElement) => {
    return renderWithProviders(
      <svg>
        <SVGDefsProvider>{ui}</SVGDefsProvider>
      </svg>,
    );
  };

  it('should show anchors for external links', () => {
    renderInSvg(<Decorator x={0} y={0} radius={10} external href="http://test" />);
    const anchor = screen.getByRole('button');
    expect(anchor).toHaveAttribute('href', 'http://test');
  });

  it('should show Links for internal links', () => {
    renderInSvg(<Decorator x={0} y={0} radius={10} href="/test" />);
    const link = screen.getByRole('button');
    expect(link).toHaveAttribute('href', '/test');
  });
});
