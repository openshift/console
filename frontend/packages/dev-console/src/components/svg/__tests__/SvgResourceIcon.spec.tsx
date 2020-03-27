import * as React from 'react';
import { shallow } from 'enzyme';
import { getKindStringAndAbbreviation, SvgResourceIcon } from '../SvgResourceIcon';

describe(getKindStringAndAbbreviation.name, () => {
  it('should return correct name and its abbrivation for the given string', () => {
    expect(getKindStringAndAbbreviation('DeploymentConfig')).toEqual({
      kindAbbr: 'DC',
      kindStr: 'DeploymentConfig',
    });
    expect(getKindStringAndAbbreviation('Deployment')).toEqual({
      kindAbbr: 'D',
      kindStr: 'Deployment',
    });
    expect(getKindStringAndAbbreviation('DaemonSet')).toEqual({
      kindAbbr: 'DS',
      kindStr: 'DaemonSet',
    });
  });
});

describe(SvgResourceIcon.name, () => {
  it('should exists', () => {
    const wrapper = shallow(<SvgResourceIcon kind="Deplyoment" x={0} y={0} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should render correct kind abbrivation', () => {
    const wrapper = shallow(<SvgResourceIcon kind="Deplyoment" x={0} y={0} />);
    expect(wrapper.find('text').text()).toEqual('D');
  });
});
