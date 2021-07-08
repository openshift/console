import * as React from 'react';
import { Switch, Tooltip, Skeleton } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { PageLayout } from '@console/shared';
import * as utils from '../../../utils/useAddActionExtensions';
import AddPageLayout from '../AddPageLayout';
import * as accessFilterHook from '../hooks/useAccessFilterExtensions';
import { useShowAddCardItemDetails } from '../hooks/useShowAddCardItemDetails';
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

jest.mock('../hooks/useShowAddCardItemDetails', () => ({
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
  const useAccessFilterExtensionsSpy = jest.spyOn(accessFilterHook, 'useAccessFilterExtensions');

  describe('Hint block', () => {
    beforeAll(() => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);
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

    it('should show default and additional provided hintBlock from props', () => {
      wrapper = shallow(<AddPageLayout {...props} hintBlock="hintBlock" />);

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
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should show correct text for switch when it is checked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);
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
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(
        wrapper
          .find(PageLayout)
          .shallow()
          .text()
          .includes(`${i18nNS}Details off`),
      ).toBe(true);
    });

    it('should show loading state for switch if add actions have not resolved', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([[], false]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], true]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Skeleton)
          .exists(),
      ).toBe(true);
    });

    it('should show loading state for switch if add actions from access check have not loaded', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], false]);
      wrapper = shallow(<AddPageLayout {...props} />);
      expect(
        wrapper
          .find(PageLayout)
          .dive()
          .find(Skeleton)
          .exists(),
      ).toBe(true);
    });
  });
});
