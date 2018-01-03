import * as React from 'react';
import * as _ from 'lodash';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp } from './utils';
// eslint-disable-next-line no-unused-vars
import { K8sFullyQualifiedResourceReference } from '../module/k8s';

import { registerTemplate } from '../yaml-templates';

registerTemplate('v1alpha1.Report', `apiVersion: chargeback.coreos.com/v1alpha1
kind: Report
metadata:
  name: example
  namespace: default
spec:
  generationQuery: aws-cluster-cost
  gracePeriod: 5m0s
  reportingEnd: '2017-12-30T23:59:59Z'
  reportingStart: '2017-01-01T00:00:00Z'
  runImmediately: true
`);

export const ReportReference: K8sFullyQualifiedResourceReference = 'Report:chargeback.coreos.com:v1alpha1';
export const ReportGenerationQueryReference: K8sFullyQualifiedResourceReference = 'ReportGenerationQuery:chargeback.coreos.com:v1alpha1';

const reportMenuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];
const reportGenerationQueryMenuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];


const ReportsHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md">Report Generation Query</ColHead>
  <ColHead {...props} className="col-lg-1 col-md-2 col-xs-4" sortField="spec.status.phase">Status</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm" sortField="spec.reportingStart">Reporting Start</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm" sortField="spec.reportingEnd">Reporting End</ColHead>
</ListHeader>;

const ReportsRow: React.StatelessComponent<ReportsRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-3 col-xs-4">
      <ResourceCog actions={reportMenuActions} kind={ReportReference} resource={obj} />
      <ResourceLink kind={ReportReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-lg-2 col-md-3 col-xs-4"><ResourceLink kind="Namespace" name={obj.metadata.namespace} namespace={undefined} title={obj.metadata.namespace} /></div>
    <div className="col-lg-2 hidden-md"><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'generationQuery'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-lg-1 col-md-2 col-xs-4">{_.get(obj, ['status', 'phase'])}</div>
    <div className="col-lg-2 col-md-2 hidden-sm"><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></div>
    <div className="col-lg-2 col-md-2 hidden-sm"><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></div>
  </div>;
};

const ReportsDetails: React.StatelessComponent<ReportsDetailsProps> = ({obj}) => {
  return <div className="col-md-12">
    <Heading text="Chargeback Report" />
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true}>
            <dt>Phase</dt>
            <dd>{_.get(obj, ['status', 'phase'])}</dd>
            <dt>Reporting Start</dt>
            <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></dd>
            <dt>Reporting End</dt>
            <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></dd>
            <dt>Generation Query</dt>
            <dd><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'generationQuery'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></dd>
            <dt>Grace Period</dt>
            <dd>{_.get(obj, ['spec', 'gracePeriod'])}</dd>
            <dt>Run Immediately?</dt>
            <dd>{Boolean(_.get(obj, ['spec', 'runImmediately'])).toString()}</dd>
          </ResourceSummary>
        </div>
      </div>
    </div>
  </div>
};

export const ReportsList: React.StatelessComponent = props => <List {...props} Header={ReportsHeader} Row={ReportsRow} />;

export const ReportsPage: React.StatelessComponent<ReportsPageProps> = props => <ListPage {...props} title="Chargeback Reports" kind={ReportReference} ListComponent={ReportsList} canCreate={true} filterLabel={props.filterLabel} />;

const pages = [navFactory.details(detailsPage(ReportsDetails)), navFactory.editYaml()];

export const ReportsDetailsPage: React.StatelessComponent<ReportsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportReference} menuActions={menuActions} pages={pages} />;
};

/* eslint-disable no-undef */
export type ReportsRowProps = {
  obj: any,
};

export type ReportsDetailsProps = {
  obj: any,
};

export type ReportsPageProps = {
  filterLabel: string,
};

export type ReportsDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

ReportsRow.displayName = 'ReportsRow';
ReportsDetails.displayName = 'ReportsDetails';
ReportsList.displayName = 'ReportsList';
ReportsPage.displayName = 'ReportsPage';
ReportsDetailsPage.displayName = 'ReportsDetailsPage';
