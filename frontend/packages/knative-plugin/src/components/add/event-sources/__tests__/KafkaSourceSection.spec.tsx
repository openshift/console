import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSourceNetSection from '../KafkaSourceNetSection';
import KafkaSourceSection from '../KafkaSourceSection';

type KafkaSourceSectionProps = React.ComponentProps<typeof KafkaSourceSection>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));
describe('KafkaSourceSection', () => {
  const title = 'Kafka Source';
  let wrapper: ShallowWrapper<KafkaSourceSectionProps>;

  it('should render KafkaSource FormSection with proper title', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    wrapper = shallow(<KafkaSourceSection title={title} namespace="my-app" />);
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('Kafka Source');
  });

  it('should render BootstrapServers and Topics fields with ', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    wrapper = shallow(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = wrapper.find(
      '[data-test-id="kafkasource-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toHaveLength(1);
    expect(bootstrapServersField.props().required).toBeTruthy();

    const topicsField = wrapper.find('[data-test-id="kafkasource-topics-field"]');
    expect(topicsField).toHaveLength(1);
    expect(topicsField.props().required).toBeTruthy();
  });

  it('should render consumergroup, netsection', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    wrapper = shallow(<KafkaSourceSection title={title} namespace="my-app" />);
    const consumerGroupField = wrapper.find('[data-test-id="kafkasource-consumergroup-field"]');
    expect(consumerGroupField).toHaveLength(1);
    expect(consumerGroupField.props().required).toBeTruthy();
    expect(wrapper.find(KafkaSourceNetSection)).toHaveLength(1);
  });

  it('should render BootstrapServers and Topics fields with even if kafkaconnections loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: null, loaded: false, loadError: 'Error' },
    });
    wrapper = shallow(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = wrapper.find(
      '[data-test-id="kafkasource-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toHaveLength(1);
    expect(bootstrapServersField.props().required).toBeTruthy();

    const topicsField = wrapper.find('[data-test-id="kafkasource-topics-field"]');
    expect(topicsField).toHaveLength(1);
    expect(topicsField.props().required).toBeTruthy();
  });
});
