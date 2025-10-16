import * as React from 'react';
import { screen } from '@testing-library/react';
import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import AddCardItem from '../AddCardItem';
import { useShowAddCardItemDetails } from '../hooks/useShowAddCardItemDetails';
import { addActionExtensions } from './add-page-test-data';
import '@testing-library/jest-dom';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('../hooks/useShowAddCardItemDetails', () => ({
  useShowAddCardItemDetails: jest.fn(),
}));

describe('AddCardItem', () => {
  type AddCardItemProps = React.ComponentProps<typeof AddCardItem>;
  let props: AddCardItemProps;
  const namespace = 'ns';

  describe('Icon', () => {
    beforeAll(() => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true]);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should render icon inside an <img /> if icon is a string', () => {
      props = {
        action: addActionExtensions.find((action) => typeof action.properties.icon === 'string'),
        namespace,
      };
      renderWithProviders(<AddCardItem {...props} />);

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should render icon as a react element if icon is not a string and a valid react element', () => {
      props = {
        action: addActionExtensions.find((action) => typeof action.properties.icon !== 'string'),
        namespace,
      };
      renderWithProviders(<AddCardItem {...props} />);

      expect(screen.getByTestId('add-card-icon')).toBeInTheDocument();
    });

    it('should not render icon if icon is neither a string nor a valid react element', () => {
      const addAction: ResolvedExtension<AddAction> = addActionExtensions[0];
      const addActionWithoutValidIcon: ResolvedExtension<AddAction> = {
        ...addAction,
        properties: { ...addAction.properties, icon: {} },
      };
      props = {
        action: addActionWithoutValidIcon,
        namespace,
      };
      renderWithProviders(<AddCardItem {...props} />);

      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-card-icon')).not.toBeInTheDocument();
    });
  });

  describe('Description', () => {
    props = {
      action: addActionExtensions[0],
      namespace,
    };

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should render description if showDetails is set to "show"', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true]);
      renderWithProviders(<AddCardItem {...props} />);
      expect(screen.getByTestId('description')).toBeInTheDocument();
    });

    it('should not render description if showDetails is set to "hide"', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([false]);
      renderWithProviders(<AddCardItem {...props} />);

      expect(screen.queryByTestId('description')).not.toBeInTheDocument();
    });
  });
});
