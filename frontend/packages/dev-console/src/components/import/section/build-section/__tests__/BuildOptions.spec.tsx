import * as React from 'react';
import { shallow } from 'enzyme';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import { SingleDropdownField, SingleDropdownFieldProps } from '@console/shared';
import { BuildOption as NamedBuildOption } from '../BuildOptions';
import * as BuildOption from '../BuildOptions';

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');
const spyShipwrightBuilds = jest.spyOn(shipwrightHooks, 'useShipwrightBuilds');
const spyUseFlag = jest.spyOn(flagsModule, 'useFlag');
const spyUsePipelineAccessReview = jest.spyOn(BuildOption, 'usePipelineAccessReview');

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
  })),
}));

describe('BuildOptions', () => {
  it('should show all if Shipwright, BuildConfig & Pipelines are installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return true;
      }
      if (arg === 'OPENSHIFT_PIPELINE') {
        return true;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    spyUsePipelineAccessReview.mockReturnValue(true);
    const component = shallow(<NamedBuildOption isDisabled={false} importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(3);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([
      {
        description:
          'Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
        label: 'Builds for OpenShift (Shipwright)',
        value: 'SHIPWRIGHT_BUILD',
      },
      {
        description:
          'Build configuration describes build definitions used for transforming source code into a runnable container image.',
        label: 'BuildConfig',
        value: 'BUILDS',
      },
      {
        description:
          'Build using pipeline describes a process for transforming source code into a runnable container image. Pipelines support can be added using Red Hat OpenShift Pipelines Operator.',
        label: 'Build using pipelines',
        value: 'PIPELINES',
      },
    ]);
  });

  it('should not show BuildConfig if it is not installed (SW & Pipelines Installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return false;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    spyUsePipelineAccessReview.mockReturnValue(true);
    const component = shallow(<NamedBuildOption isDisabled={false} importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(2);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).not.toContainEqual({
      description:
        'Build configuration describes build definitions used for transforming source code into a runnable container image.',
      label: 'BuildConfig',
      value: 'BUILDS',
    });
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([
      {
        description:
          'Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
        label: 'Builds for OpenShift (Shipwright)',
        value: 'SHIPWRIGHT_BUILD',
      },
      {
        description:
          'Build using pipeline describes a process for transforming source code into a runnable container image. Pipelines support can be added using Red Hat OpenShift Pipelines Operator.',
        label: 'Build using pipelines',
        value: 'PIPELINES',
      },
    ]);
  });

  it('should not show Shipwright if it is not installed (BuildConfig Installed, Pipelines Not Installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return true;
      }
      if (arg === 'OPENSHIFT_PIPELINE') {
        return false;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(false);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: false }, true]);
    spyUsePipelineAccessReview.mockReturnValue(false);
    const component = shallow(<NamedBuildOption isDisabled={false} importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(1);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).not.toContainEqual({
      description:
        'Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
      label: 'Builds for OpenShift (Shipwright)',
      value: 'SHIPWRIGHT_BUILD',
    });
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([
      {
        description:
          'Build configuration describes build definitions used for transforming source code into a runnable container image.',
        label: 'BuildConfig',
        value: 'BUILDS',
      },
    ]);
  });
});
