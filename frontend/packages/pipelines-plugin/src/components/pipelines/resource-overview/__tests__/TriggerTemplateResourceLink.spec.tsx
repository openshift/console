import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { TriggerTemplateModel } from '../../../../models';
import TriggerTemplateResourceLink from '../TriggerTemplateResourceLink';

type TriggerTemplateResourceLinkProps = React.ComponentProps<typeof TriggerTemplateResourceLink>;
describe('TriggerTemplateResourceLink', () => {
  const props: TriggerTemplateResourceLinkProps = {
    namespace: 'test-ns',
    model: TriggerTemplateModel,
    links: [
      { routeURL: 'test-URL-1', triggerTemplateName: 'trigger1' },
      { routeURL: 'test-URL-2', triggerTemplateName: 'trigger2' },
    ],
  };
  let wrapper: ShallowWrapper<TriggerTemplateResourceLinkProps>;
  beforeEach(() => {
    wrapper = shallow(<TriggerTemplateResourceLink {...props} />);
  });
  it('should render null if links are empty', () => {
    wrapper.setProps({ links: [] });
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render links if the links are passed', () => {
    expect(wrapper.find(ResourceLink)).toHaveLength(2);
    expect(wrapper.find(ClipboardCopy)).toHaveLength(2);
  });

  it('should not render routeURL if a link has null for routeURL', () => {
    wrapper.setProps({
      links: [
        { routeURL: 'test-URL-1', triggerTemplateName: 'trigger1' },
        { routeURL: null, triggerTemplateName: 'trigger2' },
      ],
    });
    expect(wrapper.find(ResourceLink)).toHaveLength(2);
    expect(wrapper.find(ClipboardCopy)).toHaveLength(1);
  });
});
