import * as React from 'react';
import { shallow } from 'enzyme';
import { cloneDeep } from 'lodash';
import EventSourceForm from '../EventSourceForm';
import EventSourcesSelector from '../event-sources/EventSourcesSelector';
import CronJobSection from '../event-sources/CronJobSection';
import SinkSection from '../event-sources/SinkSection';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../import-types';
import KafkaSourceSection from '../event-sources/KafkaSourceSection';
import AdvancedSection from '../AdvancedSection';

type EventSourceFormProps = React.ComponentProps<typeof EventSourceForm>;
let formProps: EventSourceFormProps;

describe('EventSource Form', () => {
  const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
  beforeEach(() => {
    formProps = {
      values: {
        type: 'CronJobSource',
      },
      namespace: 'myapp',
      errors: {},
      touched: {},
      isSubmitting: true,
      isValidating: true,
      status: {},
      submitCount: 0,
      dirty: false,
      handleReset: jest.fn(),
      handleSubmit: jest.fn(),
      getFieldProps: jest.fn(),
      handleBlur: jest.fn(),
      handleChange: jest.fn(),
      initialErrors: {},
      initialStatus: {},
      initialTouched: {},
      isValid: true,
      projects: { loaded: true, loadError: '', data: [] },
      initialValues: defaultEventingData,
      registerField: jest.fn(),
      resetForm: jest.fn(),
      setErrors: jest.fn(),
      setFieldError: jest.fn(),
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
      setFormikState: jest.fn(),
      setStatus: jest.fn(),
      setSubmitting: jest.fn(),
      setTouched: jest.fn(),
      setValues: jest.fn(),
      submitForm: jest.fn(),
      unregisterField: jest.fn(),
      validateField: jest.fn(),
      validateForm: jest.fn(),
      getFieldMeta: jest.fn(),
      validateOnBlur: true,
      validateOnChange: true,
    };
  });
  it('should render SinkSection , EventSourcesSelector for all sources', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(SinkSection)).toHaveLength(1);
    expect(eventSourceForm.find(EventSourcesSelector)).toHaveLength(1);
  });

  it('should render CronJobSection for cronJob source', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(CronJobSection)).toHaveLength(1);
  });

  it('should not render CronJobSection for other source', () => {
    const modFormProps = cloneDeep(formProps);
    modFormProps.values.type = 'SinkBinding';
    const eventSourceForm = shallow(<EventSourceForm {...modFormProps} />);
    expect(eventSourceForm.find(CronJobSection)).toHaveLength(0);
  });

  it('should render KafkaSource section when KafkaSource type is selected', () => {
    const modFormProps = cloneDeep(formProps);
    modFormProps.values.type = 'KafkaSource';
    const eventSourceForm = shallow(<EventSourceForm {...modFormProps} />);
    expect(eventSourceForm.find(KafkaSourceSection)).toHaveLength(1);
  });

  it('should render Advanced options section when KafkaSource type is selected', () => {
    const modFormProps = cloneDeep(formProps);
    modFormProps.values.type = 'KafkaSource';
    const eventSourceForm = shallow(<EventSourceForm {...modFormProps} />);
    expect(eventSourceForm.find(AdvancedSection)).toHaveLength(1);
  });
});
