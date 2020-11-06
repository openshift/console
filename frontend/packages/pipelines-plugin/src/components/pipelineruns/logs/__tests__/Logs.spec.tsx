import * as React from 'react';
import { cloneDeep } from 'lodash';
import { shallow } from 'enzyme';
import { LOG_SOURCE_TERMINATED } from '@console/internal/components/utils';
import { podData, sampleContainer } from './logs-test-data';
import Logs from '../Logs';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('logs component', () => {
  let props: React.ComponentProps<typeof Logs>;

  beforeEach(() => {
    props = {
      resource: cloneDeep(podData),
      resourceStatus: LOG_SOURCE_TERMINATED,
      container: cloneDeep(sampleContainer),
      onComplete: jest.fn(),
      render: false,
      autoScroll: true,
    };
  });

  it('should show the logs block based on the render prop', () => {
    const wrapper = shallow(<Logs {...props} />);
    expect(wrapper.find('.odc-logs').prop('style').display).toBe('none');
    wrapper.setProps({ render: true });
    expect(wrapper.find('.odc-logs').prop('style').display).toBe('');
  });
});
