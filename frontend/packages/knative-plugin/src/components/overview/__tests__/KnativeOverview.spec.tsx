import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { PodRing, OverviewItem } from '@console/shared';
import { ResourceSummary } from '@console/internal/components/utils';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import { RevisionModel } from '../../../models';
import KnativeOverview from '../KnativeOverview';

describe('KnativeOverview', () => {
  let item: OverviewItem;
  beforeEach(() => {
    item = {
      buildConfigs: [],
      obj: revisionObj,
      routes: [],
      services: [],
    };
  });

  it('should render PodRing with proper resourceKind if obj.kind is RevisionModel.kind', () => {
    const wrapper = shallow(<KnativeOverview item={item} />);
    expect(wrapper.find(PodRing)).toHaveLength(1);
    expect(
      wrapper
        .find(PodRing)
        .at(0)
        .props().resourceKind,
    ).toEqual(RevisionModel);
  });
  it('should render ResourceSummary', () => {
    const wrapper = shallow(<KnativeOverview item={item} />);
    expect(wrapper.find(ResourceSummary)).toHaveLength(1);
  });
  it('should not render PodRing if obj.kind is not RevisionModel.kind', () => {
    const mockItemKindRoute = _.set(_.cloneDeep(item), 'obj.kind', 'Route');
    const wrapper = shallow(<KnativeOverview item={mockItemKindRoute} />);
    expect(wrapper.find(PodRing)).toHaveLength(0);
  });
});
