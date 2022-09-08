import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSinkSection from '../KafkaSinkSection';

type KafkaSinkSectionProps = React.ComponentProps<typeof KafkaSinkSection>;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('KafkaSinkSection', () => {
  const title = 'Kafka Sink';
  let wrapper: ShallowWrapper<KafkaSinkSectionProps>;

  it('should render KafkaSink FormSection with proper title', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    wrapper = shallow(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('Kafka Sink');
  });

  it('should render BootstrapServers and Topic fields with required and secret as not required', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    wrapper = shallow(<KafkaSinkSection title={title} namespace="my-app" />);
    const bootstrapServersField = wrapper.find('[data-test="kafkasink-bootstrapservers-field"]');
    expect(bootstrapServersField).toHaveLength(1);
    expect(bootstrapServersField.props().required).toBeTruthy();

    const topicsField = wrapper.find('[data-test="kafkasink-topic-field"]');
    expect(topicsField).toHaveLength(1);
    expect(topicsField.props().required).toBeTruthy();

    const secretField = wrapper.find('[data-test="kafkasink-secret-field"]');
    expect(secretField).toHaveLength(1);
    expect(secretField.props().required).toBeFalsy();
  });

  it('should render BootstrapServers and topic fields with even if kafkaconnections loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: null, loaded: false, loadError: 'Error' },
    });
    wrapper = shallow(<KafkaSinkSection title={title} namespace="my-app" />);
    const bootstrapServersField = wrapper.find('[data-test="kafkasink-bootstrapservers-field"]');
    expect(bootstrapServersField).toHaveLength(1);
    expect(bootstrapServersField.props().required).toBeTruthy();

    const topicsField = wrapper.find('[data-test="kafkasink-topic-field"]');
    expect(topicsField).toHaveLength(1);
    expect(topicsField.props().required).toBeTruthy();
  });
});
