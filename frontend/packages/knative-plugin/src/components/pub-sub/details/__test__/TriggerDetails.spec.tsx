import { render } from '@testing-library/react';
import * as _ from 'lodash';
import { triggerData } from '../../../../utils/__tests__/knative-eventing-data';
import TriggerDetails from '../TriggerDetails';
import '@testing-library/jest-dom';

jest.mock('../DynamicResourceLink', () => ({
  __esModule: true,
  default: 'DynamicResourceLink',
}));

jest.mock('@console/internal/components/conditions', () => ({
  Conditions: 'Conditions',
}));

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: 'SectionHeading',
  ResourceSummary: 'ResourceSummary',
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Service'),
  referenceForModel: jest.fn(() => 'eventing.knative.dev~v1~Broker'),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: 'PaneBody',
}));

jest.mock('../../../overview/FilterTable', () => ({
  __esModule: true,
  default: 'FilterTable',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: any) => Component,
}));

jest.mock('../../../../topology/knative-topology-utils', () => ({
  getTriggerFilters: jest.fn(() => ({ filters: [{ key: 'test', value: 'value' }] })),
}));

describe('TriggerDetails', () => {
  it('should render two DynamicResourceLink with respective props', () => {
    const { container } = render(<TriggerDetails obj={triggerData} />);
    const dynamicResourceLinks = container.querySelectorAll('dynamicresourcelink');
    expect(dynamicResourceLinks).toHaveLength(2);
  });

  it('should render FilterTable if filter is present', () => {
    const { container } = render(<TriggerDetails obj={triggerData} />);
    expect(container.querySelector('filtertable')).toBeInTheDocument();
  });

  it('should render Conditions if status is present', () => {
    const { container } = render(<TriggerDetails obj={triggerData} />);
    expect(container.querySelector('conditions')).toBeInTheDocument();
  });

  it('should not render FilterTable if filter is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'spec.filter');
    const { container } = render(<TriggerDetails obj={triggerDataClone} />);
    expect(container.querySelector('filtertable')).toBeInTheDocument();
  });

  it('should not render Conditions if status is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'status');
    const { container } = render(<TriggerDetails obj={triggerDataClone} />);
    expect(container.querySelector('conditions')).not.toBeInTheDocument();
  });
});
