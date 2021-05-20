import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { PageLayout } from '@console/shared';
import { Switch, Tooltip } from '@patternfly/react-core';
import { LoadingBox } from '@console/internal/components/utils';
import { useShowAddCardItemDetails } from '../../../hooks/useShowAddCardItemDetails';
import * as utils from '../../../utils/useAddActionExtensions';
import AddPageLayout from '../AddPageLayout';
import { addActionExtensions } from './add-page-test-data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => {
  const addActionGroupExtensions = require.requireActual('./add-page-test-data');
  return { useExtensions: () => addActionGroupExtensions };
});

jest.mock('../../../hooks/useShowAddCardItemDetails', () => ({
  useShowAddCardItemDetails: jest.fn(),
}));

const i18nNS = 'devconsole~';

describe('AddPageLayout', () => {
  type AddPageLayoutProps = React.ComponentProps<typeof AddPageLayout>;
  let wrapper: ShallowWrapper<AddPageLayoutProps>;
  const props: AddPageLayoutProps = {
    title: 'title',
  };
  const useAddActionExtensionsSpy = jest.spyOn(utils, 'useAddActionExtensions');

  describe('Render based on if add action extensions are resolved', () => {
    beforeEach(() => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should render loading state if add action extensions are not resolved', () => {
      useAddActionExtensionsSpy.mockReturnValueOnce([addActionExtensions, false]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(wrapper.find(LoadingBox).exists()).toBe(true);
    });

    it('should render PageLayout if add action extensions are resolved', () => {
      useAddActionExtensionsSpy.mockReturnValueOnce([addActionExtensions, true]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(wrapper.find(PageLayout).exists()).toBe(true);
    });
  });

  describe('Hint block', () => {
    beforeAll(() => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should show default hintBlock if no hintBlock is provided in props', () => {
      wrapper = shallow(<AddPageLayout {...props} />);

      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Switch)
          .exists(),
      ).toBe(true);

      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Tooltip)
          .exists(),
      ).toBe(true);
    });

    it('should show hintBlock from props and not default hintBlock if a hintBlock is provided in props', () => {
      wrapper = shallow(<AddPageLayout {...props} hintBlock="hintBlock" />);

      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Switch)
          .exists(),
      ).toBe(false);

      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Tooltip)
          .exists(),
      ).toBe(false);

      expect(
        wrapper
          .find(PageLayout)
          .shallow()
          .text()
          .includes('hintBlock'),
      ).toBe(true);
    });
  });

  describe('Details switch', () => {
    beforeEach(() => {
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should show correct text for switch when it is checked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(
        wrapper
          .find(PageLayout)
          .shallow()
          .text()
          .includes(`${i18nNS}Details on`),
      ).toBe(true);
    });

    it('should show correct text for switch when it is unchecked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([false, () => {}]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(
        wrapper
          .find(PageLayout)
          .shallow()
          .text()
          .includes(`${i18nNS}Details off`),
      ).toBe(true);
    });
  });
});
