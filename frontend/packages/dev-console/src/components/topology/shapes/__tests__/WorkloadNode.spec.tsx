import * as React from 'react';
import { mount } from 'enzyme';
import { SVGDefsProvider } from '@console/topology';
import { MockResources } from '../../__tests__/topology-test-data';
import { transformTopologyData } from '../../../topology2/topology-utils';
import WorkloadNode from '../WorkloadNode';

jest.mock('@console/internal/components/catalog/catalog-item-icon', () => ({
  getImageForIconClass: (path: string) => (path === 'icon-unknown' ? null : path),
}));

describe('WorkloadNode', () => {
  let workloadData;
  beforeAll(() => {
    const topologyData = transformTopologyData(MockResources, ['deploymentConfigs'], undefined);
    const topologyTransformedData = topologyData.topology;
    workloadData = topologyTransformedData[Object.keys(topologyTransformedData)[0]];
  });

  xit('should render the decorators', () => {
    const wrapper = mount(
      <SVGDefsProvider>
        <WorkloadNode
          x={0}
          y={0}
          size={100}
          data={workloadData}
          id={workloadData.id}
          name={workloadData.name}
        />
      </SVGDefsProvider>,
    );
    expect(wrapper.find('.odc-decorator__link').length).toBe(2);

    expect(
      wrapper
        .find('.odc-decorator__link')
        .at(0)
        .props().xlinkHref,
    ).toBe(workloadData.data.editUrl);

    expect(
      wrapper
        .find('.odc-decorator__link')
        .at(1)
        .props().xlinkHref,
    ).toBe(workloadData.data.url);
  });
});
