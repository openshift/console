import * as React from 'react';
import { shallow } from 'enzyme';

import { EnvironmentPage } from '../../public/components/environment';
import * as k8s from '../../public/module/k8s';

describe(EnvironmentPage.name, () => {

  const configMaps={}, secrets = {}, objects = {'metadata': {'namespace': 'test'}};

  let wrapper, wrapperRO;
  let environmentPage, environmentPageRO;

  describe('When readOnly attribute is "true"', () => {
    beforeEach(() => {
      environmentPageRO=<EnvironmentPage.WrappedComponent
        obj={objects}
        rawEnvData={[ { 'env': [ { 'name': 'test', 'value': ':0', 'ID': 0 } ] } ]}
        envPath={[]}
        readOnly={true}
      />;
      wrapperRO = shallow(environmentPageRO);
    });

    it('does not show help text', () => {
      expect(wrapperRO.find('p').exists()).toEqual(false);
    });

    it('does not render save and reload buttons', () => {
      expect(wrapperRO.find('.environment-buttons button').exists()).toEqual(false);
    });
  });

  describe('When readOnly attribute is "false"', () => {
    beforeEach(() => {
      spyOn(k8s, 'k8sGet').and.callFake(() => Promise.resolve());
      environmentPage=<EnvironmentPage.WrappedComponent
        obj={objects}
        rawEnvData={[ { 'env': [ { 'name': 'test', 'value': ':0', 'ID': 0 } ] } ]}
        envPath={[]}
        readOnly={false}
      />;
      wrapper = shallow(environmentPage);
      wrapper.setState({secrets, configMaps});
    });

    it('shows help text', () => {
      expect(wrapper.find('p').text()).toContain('Define environment variables as key-value pairs to store configuration settings.');
    });

    it('renders save and reload buttons', () => {
      expect(wrapper.find('.environment-buttons button').exists()).toEqual(true);
    });
  });

  describe('When page has error messages or alerts', () => {
    beforeEach(() => {
      environmentPage=<EnvironmentPage.WrappedComponent
        obj={objects}
        rawEnvData={[ { 'env': [ { 'name': 'test', 'value': ':0', 'ID': 0 } ] } ]}
        envPath={[]}
        readOnly={true}
      />;
      wrapper = shallow(environmentPage);
      wrapper.setState({secrets, configMaps});
    });

    it('renders error message when error in state', () => {
      wrapper.setState({errorMessage: 'errorMessage'});
      expect(wrapper.find('.environment-buttons p').text()).toContain('errorMessage');
    });

    it('renders error message when data is stale', () => {
      wrapper.setState({stale: true});
      expect(wrapper.find('.environment-buttons p').text()).toContain('The information on this page is no longer current. Click Reload to update and lose edits, or Save Changes to overwrite.');
    });

    it('renders success message when data is updated successfully', () => {
      wrapper.setState({success: 'success'});
      expect(wrapper.find('.environment-buttons p').text()).toContain('success');
    });
  });

  describe('When page does not have error messages or alerts', () => {
    beforeEach(() => {
      environmentPage=<EnvironmentPage.WrappedComponent
        obj={objects}
        rawEnvData={[ { 'env': [ { 'name': 'test', 'value': ':0', 'ID': 0 } ] } ]}
        envPath={[]}
        readOnly={true}
      />;
      wrapper = shallow(environmentPage);
      wrapper.setState({secrets, configMaps});
    });

    it('does not render error message when error not in state', () => {
      expect(wrapper.find('.environment-buttons p').exists()).toEqual(false);
    });

    it('does not render error message when data is not stale', () => {
      expect(wrapper.find('.environment-buttons p').exists()).toEqual(false);
    });

    it('does not render success message when data is not updated', () => {
      expect(wrapper.find('.environment-buttons p').exists()).toEqual(false);
    });
  });
});
