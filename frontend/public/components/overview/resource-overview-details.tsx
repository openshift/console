import * as React from 'react';
import { connect } from 'react-redux';

import { UIActions } from '../../ui/ui-actions';
import { K8sKind } from '../../module/k8s';
import {
  CogAction,
  ResourceOverviewHeading,
  SimpleTabNav,
} from '../utils';

const stateToProps = ({UI}): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab'])
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name))
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

/* eslint-disable no-unused-vars, no-undef */
type PropsFromState = {
  selectedDetailsTab: any
};

type PropsFromDispatch = {
  onClickTab: (name: string) => void;
};

type OwnProps = {
  item: any;
  kindObj: K8sKind;
  menuActions: CogAction[];
  tabs: any;
};

type ResourceOverviewDetailsProps = PropsFromState & PropsFromDispatch & OwnProps;
/* eslint-enable no-unused-vars, no-undef */
