import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import KafkaSourceSection from '../KafkaSourceSection';
import { EventSources } from '../../import-types';
import KafkaSourceNetSection from '../KafkaSourceNetSection';
import ServiceAccountDropdown from '../../../dropdowns/ServiceAccountDropdown';

type KafkaSourceSectionProps = React.ComponentProps<typeof KafkaSourceSection>;

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'KafkaSource',
      data: {
        kafkasource: {
          bootstrapServers: [''],
          topics: [''],
        },
      },
    },
  })),
}));
describe('KafkaSourceSection', () => {
  let wrapper: ShallowWrapper<KafkaSourceSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<KafkaSourceSection />);
  });

  it('should render KafkaSource FormSection with proper title', () => {
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe(EventSources.KafkaSource);
  });

  it('should render BootstrapServers and Topics fields', () => {
    const bootstrapServersField = wrapper.find(
      '[data-test-id="kafkasource-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toHaveLength(1);
    expect(bootstrapServersField.props().required).toBeTruthy();

    const topicsField = wrapper.find('[data-test-id="kafkasource-topics-field"]');
    expect(topicsField).toHaveLength(1);
    expect(topicsField.props().required).toBeTruthy();
  });

  it('should render consumergroup, netsection and service dropdown', () => {
    const consumerGroupField = wrapper.find('[data-test-id="kafkasource-consumergroup-field"]');
    expect(consumerGroupField).toHaveLength(1);
    expect(consumerGroupField.props().required).toBeTruthy();

    expect(wrapper.find(KafkaSourceNetSection)).toHaveLength(1);
    expect(wrapper.find(ServiceAccountDropdown)).toHaveLength(1);
  });
});
