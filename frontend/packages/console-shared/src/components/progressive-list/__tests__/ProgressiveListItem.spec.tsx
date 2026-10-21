import type { FC } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import ProgressiveListItem from '../ProgressiveListItem';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const DummyComponent: FC = () => <div>Dummy Component</div>;

describe('ProgressiveListItem', () => {
  it('should render the child component correctly', () => {
    renderWithProviders(
      <ProgressiveListItem name="Dummy">
        <DummyComponent />
      </ProgressiveListItem>,
    );
    expect(screen.getByText('Dummy Component')).toBeInTheDocument();
  });
});
