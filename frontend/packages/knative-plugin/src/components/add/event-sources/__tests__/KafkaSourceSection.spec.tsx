import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSourceSection from '../KafkaSourceSection';
import { EventSources } from '../../import-types';
import KafkaSourceNetSection from '../KafkaSourceNetSection';
import ServiceAccountDropdown from '../../../dropdowns/ServiceAccountDropdown';

type KafkaSourceSectionProps = React.ComponentProps<typeof KafkaSourceSection>;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));
describe('KafkaSourceSection', () => {
  let wrapper: ShallowWrapper<KafkaSourceSectionProps>;

  it('should render KafkaSource FormSection with proper title', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    wrapper = shallow(<KafkaSourceSection />);
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe(EventSources.KafkaSource);
  });

  it('should render BootstrapServers and Topics fields with ', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    wrapper = shallow(<KafkaSourceSection />);
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
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    wrapper = shallow(<KafkaSourceSection />);
    const consumerGroupField = wrapper.find('[data-test-id="kafkasource-consumergroup-field"]');
    expect(consumerGroupField).toHaveLength(1);
    expect(consumerGroupField.props().required).toBeTruthy();

    expect(wrapper.find(KafkaSourceNetSection)).toHaveLength(1);
    expect(wrapper.find(ServiceAccountDropdown)).toHaveLength(1);
  });
});
