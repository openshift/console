import * as React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import AddCardSection from '../AddCardSection';
import { addActionExtensions, addActionGroupExtensions } from './add-page-test-data';

describe('AddCardSection', () => {
  type AddCardSectionProps = React.ComponentProps<typeof AddCardSection>;
  const props: AddCardSectionProps = {
    namespace: 'ns',
    addActionExtensions,
    addActionGroupExtensions,
  };

  it('should render Empty state if extensionsLoaded is true but loadingError is also true', () => {
    renderWithProviders(
      <AddCardSection {...props} addActionExtensions={[]} extensionsLoaded loadingFailed />,
    );
    expect(screen.getByRole('heading', { level: 2, name: /unable to load/i })).toBeInTheDocument();
  });

  it('should render Empty state if extensionsLoaded is true but accessCheckError is also true', () => {
    renderWithProviders(
      <AddCardSection {...props} addActionExtensions={[]} extensionsLoaded accessCheckFailed />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: /access permissions needed/i }),
    ).toBeInTheDocument();
  });

  it('should render MasonryLayout if extensionsLoaded is true and addActionExtensions array is not empty', () => {
    renderWithProviders(<AddCardSection {...props} extensionsLoaded />);
    expect(screen.getByTestId('add-cards')).toBeInTheDocument();
  });
});
