import * as React from 'react';
import { render } from '@testing-library/react';
import {
  allConnectedServiceBindings,
  allFailedServiceBindings,
} from '../../../__tests__/mock-data';
import ServiceBindingStatus from '../ServiceBindingStatus';

describe('ServiceBindingStatus', () => {
  it('should render Connected when all three conditions are true', () => {
    allConnectedServiceBindings.forEach((serviceBinding) => {
      const renderResult = render(<ServiceBindingStatus serviceBinding={serviceBinding} />);
      renderResult.getByText('Connected');
      renderResult.unmount();
    });
  });

  it('should render Error when one of the three conditions are false or missing', () => {
    allFailedServiceBindings.forEach((serviceBinding) => {
      const renderResult = render(<ServiceBindingStatus serviceBinding={serviceBinding} />);
      renderResult.getByText('Error');
      renderResult.unmount();
    });
  });
});
