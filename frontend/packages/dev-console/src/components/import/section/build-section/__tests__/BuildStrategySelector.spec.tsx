import * as React from 'react';
import { shallow } from 'enzyme';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
import { SingleDropdownField, SingleDropdownFieldProps } from '@console/shared';
import { BuildStrategySelector } from '../BuildStrategySelector';

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
  })),
}));

describe('BuildStrategySelector', () => {
  it('should not render SingleDropdownField if clusterBuildStrategy is not loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{}, false]);
    const component = shallow(<BuildStrategySelector formType="create" importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(false);
  });

  it('should list source-to-image if BuildImage Import Strategy is selected, s2i clusterBuildStrategy is found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    const component = shallow(<BuildStrategySelector formType="create" importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(1);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([{ label: 'Source-to-Image', value: 'source-to-image' }]);
  });

  it('should list buildah if Dockerfile Import Strategy is selected, buildah clusterBuildStrategy is found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: true }, true]);
    const component = shallow(<BuildStrategySelector formType="create" importStrategy={1} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(1);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([{ label: 'Buildah', value: 'buildah' }]);
  });

  it('should not list buildah if buildah clusterBuildStrategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: false }, true]);
    const component = shallow(<BuildStrategySelector formType="create" importStrategy={1} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(0);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([]);
  });

  it('should not list s2i if s2i clusterBuildStrategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: false }, true]);
    const component = shallow(<BuildStrategySelector formType="create" importStrategy={0} />);
    expect(component.find(SingleDropdownField).exists()).toBe(true);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toHaveLength(0);
    expect(
      (component.find(SingleDropdownField).props() as SingleDropdownFieldProps).options,
    ).toEqual([]);
  });
});
