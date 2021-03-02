import * as React from 'react';
import { shallow } from 'enzyme';

import { EnvironmentPage, UnconnectedEnvironmentPage } from '../../public/components/environment';
// eslint-disable-next-line import/no-duplicates
import { FieldLevelHelp } from '../../public/components/utils';
// eslint-disable-next-line import/no-duplicates
import * as utils from '../../public/components/utils';
import { DeploymentModel } from '../../public/models';
import * as k8s from '../../public/module/k8s';

const i18nNS = 'public';

describe(EnvironmentPage.name, () => {
  const configMaps = {},
    secrets = {},
    obj = { metadata: { namespace: 'test' } };

  let wrapper, wrapperRO;
  let environmentPage, environmentPageRO;

  describe('When readOnly attribute is "true"', () => {
    beforeEach(() => {
      environmentPageRO = (
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={(key) => key}
        />
      );
      wrapperRO = shallow(environmentPageRO);
      wrapperRO.setState({ allowed: true });
    });

    it('does not show field level help', () => {
      expect(wrapperRO.find(FieldLevelHelp).exists()).toEqual(false);
    });

    it('does not render save and reload buttons', () => {
      expect(wrapperRO.find('.environment-buttons button').exists()).toEqual(false);
    });
  });

  describe('When user does not have permission', () => {
    beforeEach(() => {
      spyOn(utils, 'checkAccess').and.callFake(() =>
        Promise.resolve({ status: { allowed: false } }),
      );
      environmentPageRO = (
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={(key) => key}
        />
      );
      wrapperRO = shallow(environmentPageRO);
    });

    it('does not show field level help', () => {
      expect(wrapperRO.find(FieldLevelHelp).exists()).toEqual(false);
    });

    it('does not render save and reload buttons', () => {
      expect(wrapperRO.find('.environment-buttons button').exists()).toEqual(false);
    });
  });

  describe('When readOnly attribute is "false"', () => {
    beforeEach(() => {
      spyOn(k8s, 'k8sGet').and.callFake(() => Promise.resolve());
      spyOn(utils, 'checkAccess').and.callFake(() =>
        Promise.resolve({ status: { allowed: true } }),
      );
      environmentPage = (
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={(key) => key}
        />
      );
      wrapper = shallow(environmentPage);
      wrapper.setState({ secrets, configMaps });
    });

    it('shows field level help component', () => {
      expect(wrapper.find(FieldLevelHelp).exists()).toEqual(true);
    });

    it('renders save and reload buttons', () => {
      expect(
        wrapper
          .find({ type: 'submit', variant: 'primary' })
          .childAt(0)
          .text(),
      ).toEqual(`${i18nNS}~Save`);
      expect(
        wrapper
          .find({ type: 'button', variant: 'secondary' })
          .childAt(0)
          .text(),
      ).toEqual(`${i18nNS}~Reload`);
    });
  });

  describe('When page has error messages or alerts', () => {
    beforeEach(() => {
      environmentPage = (
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={(key) => key}
        />
      );
      wrapper = shallow(environmentPage);
      wrapper.setState({ secrets, configMaps, allowed: true });
    });

    it('renders error message when error in state', () => {
      wrapper.setState({ errorMessage: 'errorMessage' });
      expect(wrapper.find('.environment-buttons Alert [variant="danger"]'));
    });

    it('renders error message when data is stale', () => {
      wrapper.setState({ stale: true });
      expect(wrapper.find('.environment-buttons Alert [variant="info"]'));
    });

    it('renders success message when data is updated successfully', () => {
      wrapper.setState({ success: 'success' });
      expect(wrapper.find('.environment-buttons Alert [variant="success"]'));
    });
  });

  describe('When page does not have error messages or alerts', () => {
    beforeEach(() => {
      environmentPage = (
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={(key) => key}
        />
      );
      wrapper = shallow(environmentPage);
      wrapper.setState({ secrets, configMaps });
    });

    it('does not render error message when error not in state', () => {
      expect(wrapper.find('.environment-buttons Alert').exists()).toEqual(false);
    });

    it('does not render error message when data is not stale', () => {
      expect(wrapper.find('.environment-buttons Alert').exists()).toEqual(false);
    });

    it('does not render success message when data is not updated', () => {
      expect(wrapper.find('.environment-buttons Alert').exists()).toEqual(false);
    });
  });
});
