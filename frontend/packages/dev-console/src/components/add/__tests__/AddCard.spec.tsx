import * as React from 'react';
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import AddCard from '../AddCard';
import { addActionExtensions } from './add-page-test-data';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

describe('AddCard', () => {
  type AddCardProps = React.ComponentProps<typeof AddCard>;
  let props: AddCardProps;

  beforeEach(() => {
    props = {
      id: 'id',
      title: 'Title',
      items: addActionExtensions,
      namespace: 'ns',
    };
  });

  it('should render null if no items are passed', () => {
    renderWithProviders(<AddCard {...props} items={[]} />);
    expect(screen.queryByTestId('card id')).not.toBeInTheDocument();
  });

  it('should render add group title if there are more than one items', () => {
    renderWithProviders(<AddCard {...props} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('should render add group title if there is only one item but its label does not match the add group title', () => {
    const updatedProps = { ...props, items: [addActionExtensions[0]] };
    renderWithProviders(<AddCard {...updatedProps} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('should not render add group title if there is only one item and its label matches the add group title', () => {
    const addAction = addActionExtensions[0];
    const updatedProps = { ...props, items: [addAction], title: addAction.properties.label };
    renderWithProviders(<AddCard {...updatedProps} />);
    expect(
      screen.queryByRole('heading', { level: 2, name: addAction.properties.label }),
    ).not.toBeInTheDocument();
  });
});
