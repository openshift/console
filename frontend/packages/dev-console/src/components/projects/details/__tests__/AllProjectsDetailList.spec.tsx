import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { AllProjectsDetailList } from '../AllProjectsDetailList';

describe('AllProjectsDetailList', () => {
  it('expect AllProjectsDetailList to render redirect when an active namespace is present', () => {
    const component = shallow(<AllProjectsDetailList activeNamespace="test-namespace" />);

    expect(component.find(Redirect).exists()).toBe(true);
  });

  it('expect AllProjectDetailsList to not render a redirect when in the all-projects namespace', () => {
    const component = shallow(<AllProjectsDetailList activeNamespace={ALL_NAMESPACES_KEY} />);

    expect(component.find(Redirect).exists()).not.toBe(true);
  });
});
