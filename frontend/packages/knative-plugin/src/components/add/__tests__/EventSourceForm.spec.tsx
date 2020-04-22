import * as React from 'react';
import { shallow } from 'enzyme';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import EventSourceForm from '../EventSourceForm';
import EventSourcesSelector from '../event-sources/EventSourcesSelector';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../import-types';
import EventSourceSection from '../event-sources/EventSourceSection';

type EventSourceFormProps = React.ComponentProps<typeof EventSourceForm>;
let formProps: EventSourceFormProps;

describe('EventSource Form', () => {
  const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: {
        type: 'CronJobSource',
      },
      namespace: 'myapp',
      projects: { loaded: true, loadError: '', data: [] },
      initialValues: defaultEventingData,
    };
  });

  it('should render EventSourcesSelector', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(EventSourcesSelector)).toHaveLength(1);
  });

  it('should render EventSourceSection', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(EventSourceSection)).toHaveLength(1);
  });
});
