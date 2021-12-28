import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { ExternalLinkWithCopy, ResourceLink } from '@console/internal/components/utils';
import store from '@console/internal/redux';
import * as triggerUtils from '../../utils/triggers';
import TriggersOverview from '../TriggersOverview';

const templateNames = jest.spyOn(triggerUtils, 'usePipelineTriggerTemplateNames');

const sampleTemplateNames = [
  {
    routeURL: 'http://devcluster.openshift.com',
    triggerTemplateName: 'trigger-template-nodejs-ex-jvb0f9',
  },
];
describe('Pipeline sidebar overview', () => {
  let props: React.ComponentProps<typeof TriggersOverview>;

  beforeEach(() => {
    props = {
      pipeline: { metadata: { name: 'pipeline', namespace: 'test' }, spec: { tasks: [] } },
    };
    templateNames.mockReturnValue([]);
  });
  it('should not show trigger template and url when there are no templateNames', () => {
    const wrapper = mount(
      <Provider store={store}>
        <TriggersOverview {...props} />
      </Provider>,
    );

    expect(wrapper.find('[data-test="triggers-heading"]')).toHaveLength(0);
    expect(wrapper.find('[data-test="triggers-list"]')).toHaveLength(0);
  });

  it('should show trigger template and url', () => {
    templateNames.mockReturnValue(sampleTemplateNames);
    const wrapper = mount(
      <Provider store={store}>
        <TriggersOverview {...props} />
      </Provider>,
    );

    expect(wrapper.find('[data-test="triggers-heading"]')).toHaveLength(1);
    expect(wrapper.find('[data-test="triggers-list-item"]')).toHaveLength(1);
    expect(wrapper.find(ResourceLink).props().title).toBe('trigger-template-nodejs-ex-jvb0f9');
    expect(wrapper.find(ExternalLinkWithCopy).props().link).toBe('http://devcluster.openshift.com');
  });
});
