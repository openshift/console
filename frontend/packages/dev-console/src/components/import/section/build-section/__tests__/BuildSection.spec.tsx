import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { FormikValues } from 'formik';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import { EnvironmentField } from '@console/shared';
import BuildConfigSection from '../../../advanced/BuildConfigSection';
import * as builderImageHooks from '../../../builder/builderImageHooks';
import {
  BuildData,
  BuildOptions,
  DetectedStrategyFormData,
  GitImportFormData,
} from '../../../import-types';
import { BuildOption as NamedBuildOption } from '../BuildOptions';
import { BuildSection } from '../BuildSection';
import { BuildStrategySelector } from '../BuildStrategySelector';

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');
const spyUseFlag = jest.spyOn(flagsModule, 'useFlag');

const spyUseBuilderImageEnvironments = jest.spyOn(builderImageHooks, 'useBuilderImageEnvironments');

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
  })),
}));

describe('BuildSection', () => {
  beforeEach(() => {
    spyUseFlag.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    spyUseBuilderImageEnvironments.mockReturnValue([[], true]);
  });

  const componentProps = {
    values: {
      project: { name: 'my-app' },
      build: { option: BuildOptions.BUILDS, env: [] },
      image: { selected: 'nodejs-ex', tag: 'latest' },
      import: { selectedStrategy: { type: 0 } },
    } as FormikValues & GitImportFormData,
    appResources: {},
  };

  it('should render the BuildSection component', () => {
    const wrapper = shallow(<BuildSection values={componentProps.values} />);
    expect(wrapper.exists()).toBe(true);
  });

  it('should render BuildOption component', () => {
    const wrapper = shallow(<BuildSection values={componentProps.values} />);
    expect(wrapper.find(NamedBuildOption).exists()).toBe(true);
  });

  it('should render the StrategySelector if Shipwright is selected', () => {
    const wrapper = shallow(
      <BuildSection
        values={{
          ...componentProps.values,
          build: { option: BuildOptions.SHIPWRIGHT_BUILD } as BuildData,
        }}
      />,
    );
    expect(wrapper.find(BuildStrategySelector).exists()).toBe(true);
  });

  it('should render buildConfig section if BuildConfig is selected', () => {
    const wrapper = shallow(
      <BuildSection
        values={{
          ...componentProps.values,
          build: { option: BuildOptions.BUILDS } as BuildData,
        }}
      />,
    );
    expect(wrapper.find(BuildConfigSection).exists()).toBe(true);
  });

  it('should not render ExpandableSection if Pipelines is selected', () => {
    const wrapper = shallow(
      <BuildSection
        values={{
          ...componentProps.values,
          pipeline: { enabled: true },
        }}
      />,
    );
    expect(wrapper.find(ExpandableSection).exists()).toBe(false);
  });

  it('should render EnvironmentField if envLoaded is true', () => {
    const wrapper = shallow(<BuildSection values={componentProps.values} />);
    expect(wrapper.find(EnvironmentField).exists()).toBe(true);
  });

  it('should render EnvironmentField and have values of Environment if Import Strategy is Serverless Function', () => {
    const wrapper = shallow(
      <BuildSection
        values={{
          ...componentProps.values,
          import: {
            knativeFuncLoaded: true, // env already loaded
            selectedStrategy: {
              type: 3,
            } as DetectedStrategyFormData,
          },
          build: {
            option: BuildOptions.BUILDS,
            env: [{ name: 'name', value: 'value' }],
          } as BuildData,
        }}
      />,
    );
    expect(wrapper.find(EnvironmentField).exists()).toBe(true);
    expect(wrapper.find(EnvironmentField).props().envs).toEqual([{ name: 'name', value: 'value' }]);
  });
});
