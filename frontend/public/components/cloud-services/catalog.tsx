/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';
import { Map } from 'immutable';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';

import { ListPage, List, ListHeader, ColHead, ResourceRow } from '../factory';
import { Firehose, NavTitle } from '../utils';
import { AppTypeLogo, CatalogEntryKind, K8sResourceKind, AppTypeKind, ClusterServiceVersionPhase } from './index';
import { createInstallApplicationModal } from '../modals/install-application-modal';
import { k8sCreate } from '../../module/k8s';

export const CatalogAppHeader = (props: CatalogAppHeaderProps) => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-6">Status</ColHead>
  <ColHead {...props} className="col-xs-2">Actions</ColHead>
</ListHeader>;

const stateToProps = ({k8s}, {obj}) => ({
  namespaces: k8s.get('namespaces').toJS(),
  clusterServiceVersions: _.values(k8s.getIn(['clusterserviceversion-v1s', 'data'], Map()).toJS())
    .filter((csv: any) => csv.metadata.name === obj.metadata.name),
});

export const CatalogAppRow = connect(stateToProps)((props: CatalogAppRowProps) => {
  const {namespaces, obj, clusterServiceVersions = []} = props;

  const Breakdown = (props: {clusterServiceVersions: AppTypeKind[]}) => {
    const failed = clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhaseFailed);
    const installing = clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhaseInstalling);
    const pending = clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhasePending);
    const succeeded = clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhaseSucceeded);

    // TODO(alecmerdler): Show most critical status with count
    if (props.clusterServiceVersions.length === 0) {
      return <span>Not installed</span>;
    } else if (failed.length > 0) {
      return <span>Installation Error</span>;
    } else if (installing.concat(pending).length > 0) {
      return <span>Installing...</span>;
    } else if (succeeded.length > 0) {
      return <span>Installed</span>;
    }
    return <span />;
  };

  return <ResourceRow obj={obj}>
    <div className="col-xs-4">
      <AppTypeLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} provider={{name: obj.spec.provider}} />
    </div>
    <div className="col-xs-6">
      <Breakdown clusterServiceVersions={clusterServiceVersions} />
    </div>
    <div className="col-xs-2">
      <button
        className="btn btn-primary"
        disabled={true}
        onClick={() => createInstallApplicationModal({clusterServiceVersion: obj.metadata.name, k8sCreate, namespaces, clusterServiceVersions})}>
        Install
      </button>
    </div>
  </ResourceRow>;
});

export const CatalogAppList = (props: CatalogAppListProps) => (
  <List {...props} Row={CatalogAppRow} Header={CatalogAppHeader} isList={true} label="Applications" />
);

export const CatalogAppsPage = () => <div>
  {/* FIXME(alecmerdler): Just adds `ClusterServiceVersion-v1s` to Redux store to be used in Row component, not sure if best solution */}
  <Firehose kind="ClusterServiceVersion-v1" isList={true} />
  <Firehose kind="Namespace" isList={true} />
  <ListPage
    kind="AlphaCatalogEntry-v1"
    ListComponent={CatalogAppList}
    filterLabel="Applications by name"
    title="Applications"
    showTitle={true}
  />
</div>;

export const CatalogDetails = () => <div style={{display: 'flex', flexDirection: 'column'}} className="co-m-pane">
  <div className="co-m-pane__body">
    <div className="col-sm-2 col-xs-12">
      <dl>
        <dt>Name</dt>
        <dd>Open Cloud Services</dd>
      </dl>
    </div>
    <div className="col-sm-2 col-xs-12">
      <dl>
        <dt>Provider</dt>
        <dd>CoreOS, Inc</dd>
      </dl>
    </div>
  </div>
  <div className="co-m-pane__body-section--bordered">
    <CatalogAppsPage />
  </div>
</div>;

export const CatalogsDetailsPage = () => <div>
  <Helmet>
    <title>Open Cloud Services</title>
  </Helmet>
  <NavTitle detail={true} title="Open Cloud Services" />
  <CatalogDetails />
</div>;

export type CatalogAppRowProps = {
  obj: CatalogEntryKind;
  namespaces: {data: {[name: string]: K8sResourceKind}, loaded: boolean, loadError: Object | string};
  clusterServiceVersions: AppTypeKind[];
};

export type CatalogAppHeaderProps = {

};

export type CatalogAppListProps = {
  loaded: boolean;
  data: CatalogEntryKind[];
  filters: {[key: string]: any};
};

export type CatalogDetailsProps = {

};
