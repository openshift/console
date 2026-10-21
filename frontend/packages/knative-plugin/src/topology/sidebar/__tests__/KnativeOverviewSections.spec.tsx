import { render } from '@testing-library/react';
import * as _ from 'lodash';
import type { OverviewItem } from '@console/shared';
import {
  revisionObj,
  knativeServiceObj,
  serverlessFunctionObj,
} from '../../__tests__/topology-knative-test-data';
import {
  KnativeOverviewDetails,
  KnativeOverviewRevisionPodsRing,
} from '../KnativeOverviewSections';

jest.mock('@console/internal/components/utils', () => ({
  ResourceSummary: jest.fn(() => null),
  Kebab: {
    factory: {
      ModifyLabels: jest.fn(),
      ModifyAnnotations: jest.fn(),
    },
  },
}));

jest.mock('@console/shared', () => ({
  PodRing: jest.fn(() => null),
  usePodScalingAccessStatus: jest.fn(() => false),
}));

jest.mock('@console/topology/src/components/side-bar/TopologySideBarTabSection', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../components/overview/domain-mapping/DomainMappingOverviewList', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../components/overview/EventPubSubResources', () => ({
  PubSubResourceOverviewList: jest.fn(() => null),
}));

jest.mock('../../../components/overview/EventPubSubSubscribers', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../components/overview/ServerlessFunctionType', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(() => ({
    loaded: true,
    loadError: null,
    pods: {},
  })),
}));

jest.mock('../../knative-topology-utils', () => ({
  isServerlessFunction: jest.fn(() => false),
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Service'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('KnativeOverview', () => {
  let item: OverviewItem;

  beforeEach(() => {
    item = {
      obj: revisionObj,
    };
  });

  it('should render KnativeOverviewDetails with revision object', () => {
    expect(() => render(<KnativeOverviewDetails item={item} />)).not.toThrow();
  });

  it('should render KnativeOverviewRevisionPodsRing', () => {
    expect(() => render(<KnativeOverviewRevisionPodsRing item={item} />)).not.toThrow();
  });

  it('should render with non-revision object', () => {
    const mockItemKindRoute = _.set(_.cloneDeep(item), 'obj.kind', 'Route');
    expect(() => render(<KnativeOverviewDetails item={mockItemKindRoute} />)).not.toThrow();
  });

  it('should render with knative service object', () => {
    expect(() =>
      render(<KnativeOverviewDetails item={{ obj: knativeServiceObj }} />),
    ).not.toThrow();
  });

  it('should render with serverless function object', () => {
    expect(() =>
      render(<KnativeOverviewDetails item={{ obj: serverlessFunctionObj }} />),
    ).not.toThrow();
  });
});
