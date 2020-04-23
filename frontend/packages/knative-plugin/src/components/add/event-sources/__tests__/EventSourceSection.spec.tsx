import * as React from 'react';
import { shallow } from 'enzyme';
import { FormikValues } from 'formik';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import EventSourceSection from '../EventSourceSection';
import CronJobSection from '../CronJobSection';
import SinkSection from '../SinkSection';
import { getDefaultEventingData } from '../../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../../import-types';

const mockEventingData = getDefaultEventingData(EventSources.CronJobSource);

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: mockEventingData as FormikValues,
  })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('EventSource Section', () => {
  const namespace = 'myapp';

  it('should render SinkSection, AppSection for CronjobSource', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const eventSourceSection = shallow(<EventSourceSection namespace={namespace} />);
    expect(eventSourceSection.find(SinkSection)).toHaveLength(1);
    expect(eventSourceSection.find(AppSection)).toHaveLength(1);
  });

  it('should render CronJobSection for cronJob source', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const eventSourceSection = shallow(<EventSourceSection namespace={namespace} />);
    expect(eventSourceSection.find(CronJobSection)).toHaveLength(1);
  });
});
