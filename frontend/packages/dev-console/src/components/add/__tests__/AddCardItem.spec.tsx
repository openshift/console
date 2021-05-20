import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Text } from '@patternfly/react-core';
import { CatalogIcon } from '@patternfly/react-icons';
import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { useShowAddCardItemDetails } from '../hooks/useShowAddCardItemDetails';
import AddCardItem from '../AddCardItem';
import { addActionExtensions } from './add-page-test-data';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('../hooks/useShowAddCardItemDetails', () => ({
  useShowAddCardItemDetails: jest.fn(),
}));

describe('AddCardItem', () => {
  type AddCardItemProps = React.ComponentProps<typeof AddCardItem>;
  let props: AddCardItemProps;
  let wrapper: ShallowWrapper<AddCardItemProps>;
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
      wrapper = shallow(<AddCardItem {...props} />);

      expect(wrapper.find('img').exists()).toBe(true);
    });

    it('should render icon as a react element if icon is not a string and a valid react element', () => {
      props = {
        action: addActionExtensions.find((action) => typeof action.properties.icon !== 'string'),
        namespace,
      };
      wrapper = shallow(<AddCardItem {...props} />);

      expect(wrapper.find(CatalogIcon).exists()).toBe(true);
    });

    it('should render not render icon if icon is neither a string nor a valid react element', () => {
      const addAction: ResolvedExtension<AddAction> = addActionExtensions[0];
      const addActionWithoutValidIcon: ResolvedExtension<AddAction> = {
        ...addAction,
        properties: { ...addAction.properties, icon: {} },
      };
      props = {
        action: addActionWithoutValidIcon,
        namespace,
      };
      wrapper = shallow(<AddCardItem {...props} />);

      expect(wrapper.find('img').exists()).toBe(false);
      expect(wrapper.find(CatalogIcon).exists()).toBe(false);
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
      wrapper = shallow(<AddCardItem {...props} />);

      expect(wrapper.find(Text).exists()).toBe(true);
    });

    it('should render description if showDetails is set to "hide"', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([false]);
      wrapper = shallow(<AddCardItem {...props} />);

      expect(wrapper.find(Text).exists()).toBe(false);
    });
  });
});
