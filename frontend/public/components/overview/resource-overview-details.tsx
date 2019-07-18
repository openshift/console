import * as React from 'react';
import { connect } from 'react-redux';

import { connectToExtensions, Extension, OverviewResourceTab, isOverviewResourceTab } from '@console/plugin-sdk';
import * as UIActions from '../../actions/ui';
import { K8sKind } from '../../module/k8s';
import {
  AsyncComponent,
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

const extensionsToProps = (extensions: Extension[]) => ({
  pluginOverviewResourceTabs: extensions.filter(isOverviewResourceTab),
});

const getResourceTabComp = (t) => (props) => <AsyncComponent {...props} loader={t.properties.loader} />;

const getPluginTabResources = (
  pluginOverviewResourceTabs: OverviewResourceTab[],
  item: OverviewItem,
  tabs: ResourceOverviewDetailsTab[]
) => {
  const tabEntry = pluginOverviewResourceTabs.filter(tab => item[tab.properties.key]);
  const newTabs = tabs.map(tab => {
    const tabEntryConfig = tabEntry.find(t => tab.name === t.properties.name);
    if (tabEntryConfig) {
      return {
        name: tab.name,
        component: getResourceTabComp(tabEntryConfig),
      };
    }
    return tab;
  });
  return newTabs;
};

export const ResourceOverviewDetails = connect<PropsFromState, PropsFromDispatch, OwnProps>(stateToProps, dispatchToProps)(
  connectToExtensions(extensionsToProps)(
    ({kindObj, item, menuActions, onClickTab, selectedDetailsTab, tabs, pluginOverviewResourceTabs}: ResourceOverviewDetailsProps) => (
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
          tabs={getPluginTabResources(pluginOverviewResourceTabs, item, tabs)}
        />
      </div>
    )
  )
);

type ResourceOverviewDetailsTab = {
  name: string;
  component: any;
};

type PropsFromState = {
  selectedDetailsTab: any
};

type PropsFromDispatch = {
  onClickTab: (name: string) => void;
};

type ExtensionProps = {
  pluginOverviewResourceTabs: OverviewResourceTab[],
};

type OwnProps = {
  item: OverviewItem;
  kindObj: K8sKind;
  menuActions: KebabAction[];
  tabs: ResourceOverviewDetailsTab[];
};

export type ResourceOverviewDetailsProps = PropsFromState
  & PropsFromDispatch
  & ExtensionProps
  & OwnProps;
