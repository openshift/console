import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import SelectorInputField from '@console/shared/src/components/formik-fields/SelectorInputField';
import { Resources } from '../../import-types';
import ServerlessRouteSection from '../../serverless/ServerlessRouteSection';
import AdvancedRouteOptions from '../AdvancedRouteOptions';
import CreateRoute from '../CreateRoute';
import SecureRoute from '../SecureRoute';

describe('AdvancedRoutingOptions:', () => {
  let props: React.ComponentProps<typeof AdvancedRouteOptions>;

  beforeEach(() => {
    props = {
      canCreateRoute: true,
      resources: Resources.OpenShift,
    };
  });

  it('Render AdvancedRoutingOptions', () => {
    const component = shallow(<AdvancedRouteOptions {...props} />);
    expect(component.isEmptyRender()).toBe(false);
  });

  it('should show serverless route section options', () => {
    props.resources = Resources.KnativeService;
    const component = shallow(<AdvancedRouteOptions {...props} />);
    expect(component.find(ServerlessRouteSection).exists()).toBe(true);
  });

  it('should show route section options', () => {
    props.resources = Resources.OpenShift;
    const component = shallow(<AdvancedRouteOptions {...props} />);
    expect(component.find(CreateRoute).exists()).toBe(true);
    expect(component.find(SecureRoute).exists()).toBe(true);
  });

  it('should show labels input option', () => {
    const component = shallow(<AdvancedRouteOptions {...props} />);
    expect(component.find(SelectorInputField).exists()).toBe(true);
    expect(component.find(SelectorInputField).props().name).toBe('route.labels');
    expect(component.find(SelectorInputField).props().label).toBe('Labels');
    expect(component.find(SelectorInputField).props().helpText).toBe(
      'Additional labels which are only added to the Route resource.',
    );
    expect(component.find(SelectorInputField).props().placeholder).toBe('app.io/type=frontend');
  });

  it('should not show route section and show alert', () => {
    props.canCreateRoute = false;
    const component = shallow(<AdvancedRouteOptions {...props} />);
    expect(component.find(Alert).exists()).toBe(true);
  });
});
