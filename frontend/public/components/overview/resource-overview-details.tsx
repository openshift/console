import * as React from 'react';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { K8sKind } from '../../module/k8s';
import {
  KebabAction,
  ResourceOverviewHeading,
  SimpleTabNav,
} from '../utils';

import { OverviewItem } from '.';

const stateToProps = ({UI}): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

export const ResourceOverviewDetails = connect<PropsFromState, PropsFromDispatch, OwnProps>(stateToProps, dispatchToProps)(
  ({kindObj, item, menuActions, onClickTab, selectedDetailsTab, tabs}: ResourceOverviewDetailsProps) =>
    <div className="overview__sidebar-pane resource-overview">
      <ResourceOverviewHeading
        actions={menuActions}
        kindObj={kindObj}
        resource={item.obj}
      />
      <SimpleTabNav
        onClickTab={onClickTab}
        selectedTab={selectedDetailsTab}
        tabProps={{item}}
        tabs={tabs}
      />
    </div>
);

type PropsFromState = {
  selectedDetailsTab: any
};

type PropsFromDispatch = {
  onClickTab: (name: string) => void;
};

type OwnProps = {
  item: OverviewItem;
  kindObj: K8sKind;
  menuActions: KebabAction[];
  tabs: {
    name: string;
    component: any;
  }[];
};

type ResourceOverviewDetailsProps = PropsFromState & PropsFromDispatch & OwnProps;
