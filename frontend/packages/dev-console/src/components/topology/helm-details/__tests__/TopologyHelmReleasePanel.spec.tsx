import * as React from 'react';
import { shallow } from 'enzyme';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { mockManifest } from './mockData';
import TopologyHelmReleaseResourcesPanel from '../TopologyHelmReleaseResourcesPanel';

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    const component = shallow(
      <TopologyHelmReleaseResourcesPanel manifestResources={manifestResources} />,
    );
    expect(component.find(SidebarSectionHeading)).toHaveLength(5);
  });
});
