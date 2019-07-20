import * as React from 'react';
import { shallow } from 'enzyme';
import { getKindStringAndAbbrivation, ResourceIcon } from '../ResourceIcon';

describe(getKindStringAndAbbrivation.name, () => {
  it('should return correct name and its abbrivation for the given string', () => {
    expect(getKindStringAndAbbrivation('DeploymentConfig')).toEqual({
      KindAbbr: 'DC',
      kindStr: 'DeploymentConfig',
    });
    expect(getKindStringAndAbbrivation('Deployment')).toEqual({
      KindAbbr: 'D',
      kindStr: 'Deployment',
    });
    expect(getKindStringAndAbbrivation('DaemonSet')).toEqual({
      KindAbbr: 'DS',
      kindStr: 'DaemonSet',
    });
  });
});

describe(ResourceIcon.name, () => {
  it('should exists', () => {
    const wrapper = shallow(<ResourceIcon kind="Deplyoment" x={0} y={0} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should render correct kind abbrivation', () => {
    const wrapper = shallow(<ResourceIcon kind="Deplyoment" x={0} y={0} />);
    expect(wrapper.find('text').text()).toEqual('D');
  });
});
