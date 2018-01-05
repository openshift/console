import * as React from 'react';
import * as _ from 'lodash';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp, LabelList } from './utils';
import { coFetch } from '../co-fetch';
import { saveAs } from 'file-saver';
// eslint-disable-next-line no-unused-vars
import { K8sFullyQualifiedResourceReference, resourceURL, modelFor } from '../module/k8s';

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

class ReportsDetails extends React.Component<ReportsDetailsProps> {
  download (obj, format='json') {
    const serviceModel = modelFor('Service');
    const name = _.get(obj, ['metadata', 'name']);
    const url = resourceURL(serviceModel, {
      ns: obj.metadata.namespace,
      name: 'chargeback',
      path: 'proxy/api/v1/reports/get',
      queryParams: {
        name: obj.metadata.name,
        format,
      },
    });
    coFetch(url).then(response => response.blob().then(blob => saveAs(blob, `${name}.${format}`)));
  }

  render () {
    const {obj} = this.props;
    return <div className="col-md-12">
      <Heading text="Chargeback Report" />
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <p>
              <button className="btn btn-primary" type="button" onClick={() => this.download(obj, 'csv')}>
                <i className="fa fa-download" />&nbsp;Download CSV
              </button>
            </p>
          </div>
        </div>
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
    </div>;
  }
}

export const ReportsList: React.StatelessComponent = props => <List {...props} Header={ReportsHeader} Row={ReportsRow} />;

export const ReportsPage: React.StatelessComponent<ReportsPageProps> = props => <ListPage {...props} title="Chargeback Reports" kind={ReportReference} ListComponent={ReportsList} canCreate={true} filterLabel={props.filterLabel} />;

const reportsPages = [navFactory.details(detailsPage(ReportsDetails)), navFactory.editYaml()];

export const ReportsDetailsPage: React.StatelessComponent<ReportsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportReference} menuActions={reportMenuActions} pages={reportsPages} />;
};


const ReportGenerationQueriesHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm">Labels</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.creationTimestamp">Created At</ColHead>
</ListHeader>;

const ReportGenerationQueriesRow: React.StatelessComponent<ReportGenerationQueriesRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-md-3 col-sm-4">
      <ResourceCog actions={reportGenerationQueryMenuActions} kind={ReportGenerationQueryReference} resource={obj} />
      <ResourceLink kind={ReportGenerationQueryReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-md-3 col-sm-4"><ResourceLink kind="Namespace" namespace={undefined} name={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-md-3 hidden-sm"><LabelList kind={ReportGenerationQueryReference} labels={_.get(obj, ['metadata', 'labels'])} /></div>
    <div className="col-md-3 col-sm-4"><Timestamp timestamp={_.get(obj, ['metadata', 'creationTimestamp'])} /></div>
  </div>;
};

const ReportGenerationQueriesDetails: React.StatelessComponent<ReportGenerationQueriesDetailsProps> = ({obj}) => {
  const columns = _.get(obj, ['spec', 'columns'], []).map((column, i) => <tr key={i}>
    <td>{column.name}</td>
    <td>{column.type}</td>
  </tr>);

  return <div className="col-md-12">
    <Heading text="Chargeback Report Generation Query" />
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true}>
            <dt>Query</dt>
            <dd><pre><code>{_.get(obj, ['spec', 'query'])}</code></pre></dd>
            <div className="row">
              <div className="col-xs-12">
                <h3>Columns</h3>
                <div className="co-table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ResourceSummary>
        </div>
      </div>
    </div>
  </div>;
};

export const ReportGenerationQueriesList: React.StatelessComponent = props => <List {...props} Header={ReportGenerationQueriesHeader} Row={ReportGenerationQueriesRow} />;

export const ReportGenerationQueriesPage: React.StatelessComponent<ReportGenerationQueriesPageProps> = props => <ListPage {...props} title="Chargeback Report Generation Queries" kind={ReportGenerationQueryReference} ListComponent={ReportGenerationQueriesList} canCreate={true} filterLabel={props.filterLabel} />;

const reportGenerationQueryPages = [navFactory.details(detailsPage(ReportGenerationQueriesDetails)), navFactory.editYaml()];
export const ReportGenerationQueriesDetailsPage: React.StatelessComponent<ReportGenerationQueriesDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportGenerationQueryReference} menuActions={reportGenerationQueryMenuActions} pages={reportGenerationQueryPages} />;
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

export type ReportGenerationQueriesRowProps = {
  obj: any,
};

export type ReportGenerationQueriesDetailsProps = {
  obj: any,
};

export type ReportGenerationQueriesPageProps = {
  filterLabel: string,
};

export type ReportGenerationQueriesDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

ReportsRow.displayName = 'ReportsRow';
ReportsList.displayName = 'ReportsList';
ReportsPage.displayName = 'ReportsPage';
ReportsDetailsPage.displayName = 'ReportsDetailsPage';

ReportGenerationQueriesRow.displayName = 'ReportGenerationQueriesRow';
ReportGenerationQueriesDetails.displayName = 'ReportGenerationQueriesDetails';
ReportGenerationQueriesList.displayName = 'ReportGenerationQueriesList';
ReportGenerationQueriesPage.displayName = 'ReportGenerationQueriesPage';
ReportGenerationQueriesDetailsPage.displayName = 'ReportGenerationQueriesDetailsPage';
