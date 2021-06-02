import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { QuickStartStatus } from '../../utils/quick-start-types';
import QuickStartFooter from '../QuickStartFooter';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('react', () => {
  const ActualReact = require.requireActual('react');
  return {
    ...ActualReact,
    useContext: () => jest.fn(),
  };
});

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: () => ['', () => {}],
}));

describe('QuickStartFooter', () => {
  type QuickStartFooterProps = React.ComponentProps<typeof QuickStartFooter>;
  let quickStartFooterProps: QuickStartFooterProps;
  beforeEach(() => {
    spyOn(React, 'useContext').and.returnValue({
      activeQuickStartID: '',
      startQuickStart: () => {},
      restartQuickStart: () => {},
    });
  });

  it('should load Start button for not started tours', () => {
    quickStartFooterProps = {
      status: QuickStartStatus.NOT_STARTED,
      footerClass: 'test',
      quickStartId: 'test-quickstart',
      onNext: () => null,
      onBack: () => null,
      totalTasks: 4,
      taskNumber: -1,
    };

    const quickStartFooterWrapper = shallow(<QuickStartFooter {...quickStartFooterProps} />);
    const footerButtons = quickStartFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(1);
    expect(
      footerButtons
        .at(0)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Start');
  });

  it('should load Continue and Restart buttons for in progress tours at into page', () => {
    quickStartFooterProps = {
      status: QuickStartStatus.IN_PROGRESS,
      footerClass: 'test',
      quickStartId: 'test-quickstart',
      onNext: () => null,
      onBack: () => null,
      totalTasks: 4,
      taskNumber: -1,
    };

    const quickStartFooterWrapper = shallow(<QuickStartFooter {...quickStartFooterProps} />);
    const footerButtons = quickStartFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(2);
    expect(
      footerButtons
        .at(0)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Continue');
    expect(
      footerButtons
        .at(1)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Restart');
  });

  it('should load Next and Back buttons for in progress tours in task page', () => {
    quickStartFooterProps = {
      status: QuickStartStatus.IN_PROGRESS,
      footerClass: 'test',
      quickStartId: 'test-quickstart',
      onNext: () => null,
      onBack: () => null,
      totalTasks: 4,
      taskNumber: 2,
    };

    const quickStartFooterWrapper = shallow(<QuickStartFooter {...quickStartFooterProps} />);
    const footerButtons = quickStartFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(2);
    expect(
      footerButtons
        .at(0)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Next');
    expect(
      footerButtons
        .at(1)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Back');
  });

  it('should load Close, Back and Restart buttons for completed tours in conclusion page', () => {
    quickStartFooterProps = {
      status: QuickStartStatus.COMPLETE,
      footerClass: 'test',
      quickStartId: 'test-quickstart',
      onNext: () => null,
      onBack: () => null,
      totalTasks: 4,
      taskNumber: 4,
    };

    const quickStartFooterWrapper = shallow(<QuickStartFooter {...quickStartFooterProps} />);
    const footerButtons = quickStartFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(3);
    expect(
      footerButtons
        .at(0)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Close');
    expect(
      footerButtons
        .at(1)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Back');
    expect(
      footerButtons
        .at(2)
        .childAt(0)
        .text(),
    ).toBe('quickstart~Restart');
  });
});
