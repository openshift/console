import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { K8sKind } from '../../module/k8s';
import { AsyncComponent, KebabAction, ResourceOverviewHeading, SimpleTabNav } from '../utils';
import { OverviewItem } from '@console/shared';
import { useExtensions, OverviewResourceTab, isOverviewResourceTab } from '@console/plugin-sdk';

const stateToProps = ({ UI }): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

const getResourceTabComp = (t) => (props) => (
  <AsyncComponent {...props} loader={t.properties.loader} />
);

const getPluginTabResources = (
  item,
  tabs,
  overviewResourceTabs,
): ResourceOverviewDetailsProps['tabs'] => {
  let tabEntry = overviewResourceTabs.filter((tab) => item[tab.properties.key]);
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
  }: ResourceOverviewDetailsProps) => {
    const resourceTabExtensions = useExtensions<OverviewResourceTab>(isOverviewResourceTab);
    const keys = Object.keys(item);
    const keysRef = React.useRef(keys);
    const tabsRef = React.useRef(tabs);
    const pluginTabsRef = React.useRef<React.ComponentProps<typeof SimpleTabNav>['tabs']>();
    if (
      !pluginTabsRef.current ||
      !_.isEqual(keys, keysRef.current) ||
      !_.isEqual(tabs, tabsRef.current)
    ) {
      keysRef.current = keys;
      tabsRef.current = tabs;
      pluginTabsRef.current = getPluginTabResources(item, tabs, resourceTabExtensions);
    }
    return (
      <div className="overview__sidebar-pane resource-overview">
        <ResourceOverviewHeading actions={menuActions} kindObj={kindObj} resources={item} />
        <SimpleTabNav
          onClickTab={onClickTab}
          selectedTab={selectedDetailsTab}
          tabProps={{ item }}
          tabs={pluginTabsRef.current}
          additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
        />
      </div>
    );
  },
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
