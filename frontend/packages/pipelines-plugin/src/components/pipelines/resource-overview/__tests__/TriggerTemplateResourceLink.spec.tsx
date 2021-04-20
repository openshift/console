import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ClipboardCopy } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';
import TriggerTemplateResourceLink from '../TriggerTemplateResourceLink';
import { TriggerTemplateModel } from '../../../../models';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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
