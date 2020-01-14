import * as React from 'react';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { K8sKind } from '../../module/k8s';
import { AsyncComponent, KebabAction, ResourceOverviewHeading, SimpleTabNav } from '../utils';
import * as plugins from '../../plugins';
import { OverviewItem } from '@console/shared';

const stateToProps = ({ UI }): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

const getResourceTabComp = (t) => (props) => (
  <AsyncComponent {...props} loader={t.properties.loader} />
);

const getPluginTabResources = (item, tabs): ResourceOverviewDetailsProps['tabs'] => {
  let tabEntry = plugins.registry
    .getOverviewResourceTabs()
    .filter((tab) => item[tab.properties.key]);
  const overridenTabs = tabs.map((tab) => {
    const tabEntryConfig = tabEntry.find((t) => tab.name === t.properties.name);
    if (tabEntryConfig) {
      tabEntry = tabEntry.filter((entry) => tab.name !== entry.properties.name);
      return {
        name: tab.name,
        component: getResourceTabComp(tabEntryConfig),
      };
    }
    return tab;
  });

  /** Add new tabs from plugin */
  const newTabs = tabEntry.map((entry) => {
    return {
      name: entry.properties.name,
      component: getResourceTabComp(entry),
    };
  });

  return overridenTabs.concat(newTabs);
};

export const ResourceOverviewDetails = connect<PropsFromState, PropsFromDispatch, OwnProps>(
  stateToProps,
  dispatchToProps,
)(
  ({
    kindObj,
    item,
    menuActions,
    onClickTab,
    selectedDetailsTab,
    tabs,
  }: ResourceOverviewDetailsProps) => (
    <div className="overview__sidebar-pane resource-overview">
      <ResourceOverviewHeading actions={menuActions} kindObj={kindObj} resource={item.obj} />
      <SimpleTabNav
        onClickTab={onClickTab}
        selectedTab={selectedDetailsTab}
        tabProps={{ item }}
        tabs={getPluginTabResources(item, tabs)}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  ),
);

type PropsFromState = {
  selectedDetailsTab: any;
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
  isOperatorBacked?: boolean;
};

export type ResourceOverviewDetailsProps = PropsFromState & PropsFromDispatch & OwnProps;
