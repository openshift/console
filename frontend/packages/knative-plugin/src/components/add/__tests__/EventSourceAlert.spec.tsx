import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import EventSourceAlert from '../EventSourceAlert';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('EventSourceAlert', () => {
  it('should not alert if eventSources are there', () => {
    const wrapper = shallow(
      <EventSourceAlert isValidSource createSourceAccessLoading={false} createSourceAccess />,
    );
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should show alert if eventSource is present but do not have create access', () => {
    const wrapper = shallow(
      <EventSourceAlert
        isValidSource
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should show alert if eventSource is not present', () => {
    const wrapper = shallow(
      <EventSourceAlert
        isValidSource={false}
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });
});
