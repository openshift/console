import * as React from 'react';
import { shallow } from 'enzyme';
import VMIDetailsPageInfoMessage from '../VMIDetailsPageInfoMessage';
import { mockData } from './mock_data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest
    .fn(() => {})
    .mockImplementationOnce(() => mockData.testWithVMOwner)
    .mockImplementationOnce(() => mockData.testWithoutVMOwner)
    .mockImplementationOnce(() => mockData.testNoVMILoadedTrue)
    .mockImplementationOnce(() => mockData.testLoadedFalse),
}));

describe('VMIDetailsPageInfoMessage', () => {
  it('should check if info message do not appear when vmi controlled by vm', () => {
    const wrapper = shallow(
      <VMIDetailsPageInfoMessage name="some-name" namespace="some-namespace" />,
    );
    expect(wrapper.type()).toBeNull();
  });

  it('should check if info message appear when vmi is not controlled by vm', () => {
    const wrapper = shallow(
      <VMIDetailsPageInfoMessage name="some-name" namespace="some-namespace" />,
    );
    expect(wrapper.type()).not.toBeNull();
  });

  it('should check if info message appear when vmi is null', () => {
    const wrapper = shallow(
      <VMIDetailsPageInfoMessage name="some-name" namespace="some-namespace" />,
    );
    expect(wrapper.type()).toBeNull();
  });

  it('should check if info message do not appear when vmi is not loaded yet', () => {
    const wrapper = shallow(
      <VMIDetailsPageInfoMessage name="some-name" namespace="some-namespace" />,
    );
    expect(wrapper.type()).toBeNull();
  });
});
