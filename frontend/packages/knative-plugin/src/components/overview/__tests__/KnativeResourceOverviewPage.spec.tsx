import * as React from 'react';
import { shallow } from 'enzyme';
import { OverviewItem } from '@console/shared';
import { LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import { RevisionModel } from '../../../models';
import { KnativeResourceOverviewPage } from '../KnativeResourceOverviewPage';

describe('KnativeResourceOverviewPage', () => {
  let item: OverviewItem;
  beforeEach(() => {
    item = {
      buildConfigs: [],
      obj: revisionObj,
      routes: [],
      services: [],
    };
  });

  it('should not render if kindsInFlight is true and knativeModels is empty', () => {
    const wrapper = shallow(<KnativeResourceOverviewPage item={item} kindsInFlight />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });
  it('should render LoadingBox kindsInFlight is true and knativeModels is not empty', () => {
    const wrapper = shallow(
      <KnativeResourceOverviewPage item={item} knativeModels={[RevisionModel]} kindsInFlight />,
    );
    expect(wrapper.find(LoadingBox)).toHaveLength(1);
  });
  it('should render ResourceOverviewDetails kindsInFlight is false', () => {
    const wrapper = shallow(
      <KnativeResourceOverviewPage
        item={item}
        knativeModels={[RevisionModel]}
        kindsInFlight={false}
      />,
    );
    expect(wrapper.find(ResourceOverviewDetails)).toHaveLength(1);
  });
});
