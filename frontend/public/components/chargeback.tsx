import * as React from 'react';
import * as _ from 'lodash';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, NavBar, NavTitle, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp, LabelList, DownloadButton } from './utils';
import { LoadingBox } from './utils/status-box';
import { coFetchJSON } from '../co-fetch';
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
export const ScheduledReportReference: K8sFullyQualifiedResourceReference = 'ScheduledReport:chargeback.coreos.com:v1alpha1';
export const ReportGenerationQueryReference: K8sFullyQualifiedResourceReference = 'ReportGenerationQuery:chargeback.coreos.com:v1alpha1';
export const ReportPrometheusQueryReference: K8sFullyQualifiedResourceReference = 'ReportPrometheusQuery:chargeback.coreos.com:v1alpha1';

const reportPages=[
  {name: 'All Reports', href: ReportReference},
  {name: 'Generation Queries', href: ReportGenerationQueryReference},
];

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const dataURL = (obj, format='json') => {
  const serviceModel = modelFor('Service');
  return resourceURL(serviceModel, {
    ns: obj.metadata.namespace,
    name: 'chargeback',
    path: 'proxy/api/v1/reports/get',
    queryParams: {
      name: obj.metadata.name,
      format,
    },
  });
};

const ChargebackNavBar: React.StatelessComponent<{match: {url: string}}> = props => <div>
  <NavTitle title="Chargeback Reporting" style={{paddingBottom: 15}} />
  <NavBar pages={reportPages} basePath={props.match.url.split('/').slice(0, -1).join('/')} />
</div>;


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
      <ResourceCog actions={menuActions} kind={ReportReference} resource={obj} />
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
  render () {
    const {obj} = this.props;
    const phase = _.get(obj, ['status', 'phase']);
    return <div className="col-md-12">
      <Heading text="Chargeback Report" />
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true}>
              <dt>Phase</dt>
              <dd>{phase}</dd>
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
      <ReportData obj={obj} />
    </div>;
  }
}

const colsWhitelist = new Set(['node', 'pod', 'namespace', 'pod_request_cpu_core_seconds']);

class ReportData extends React.Component<ReportDataProps, ReportDataState> {
  constructor (props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
      data: null,
    };
  }

  fetchData () {
    this.setState({
      inFlight: true,
      error: null,
    });
    coFetchJSON(dataURL(this.props.obj))
      .then(res => this.setState({data: res}))
      .catch(e => this.setState({error: e}))
      .then(() => this.setState({inFlight: false}));
  }

  componentDidMount () {
    const phase = _.get(this.props.obj, ['status', 'phase']);
    if (phase === 'Finished') {
      this.fetchData();
    }
  }

  render () {
    const {obj} = this.props;
    const phase = _.get(obj, ['status', 'phase']);

    let dataElem = <p>Report not finished running.</p>;
    if (phase === 'Finished') {
      const data = this.state.data;
      if (data) {
        const keys = _.keys(data[0]).filter(k => colsWhitelist.has(k));
        const cols = _.map(keys, k => <th key={k}>{k}</th>);
        const rows = _.map(data, (row, i) => {
          const elems = _.map(keys, k => <td key={k}>{_.isFinite(row[k]) ? _.round(row[k], 2) : row[k]}</td>);
          return <tr key={i}>{elems}</tr>;
        });
        dataElem = <table>
          <thead><tr>{cols}</tr></thead>
          <tbody>{rows}</tbody>
        </table>;
        // dataElem = <pre>{JSON.stringify(data, null, 2)}</pre>;
      } else {
        dataElem = <LoadingBox />;
      }
    }

    const name = _.get(obj, ['metadata', 'name']);
    const format = 'csv';
    const downloadURL = dataURL(obj, format);

    return <div>
      <Heading text="Usage Report">
        <DownloadButton className="pull-right" url={downloadURL} filename={`${name}.${format}`} />
      </Heading>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            { dataElem }
          </div>
        </div>
      </div>
    </div>;
  }
}

const reportsPages = [
  navFactory.details(detailsPage(ReportsDetails)),
  navFactory.editYaml(),
];

export const ReportsList: React.StatelessComponent = props => <List {...props} Header={ReportsHeader} Row={ReportsRow} pages={reportsPages} />;

export const ReportsPage: React.StatelessComponent<ReportsPageProps> = props => <div>
  <ChargebackNavBar match={props.match} />
  <ListPage {...props} showTitle={false} kind={ReportReference} ListComponent={ReportsList} canCreate={true} filterLabel={props.filterLabel} />
</div>;

export const ReportsDetailsPage: React.StatelessComponent<ReportsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportReference} menuActions={menuActions} pages={reportsPages} />;
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
      <ResourceCog actions={menuActions} kind={ReportGenerationQueryReference} resource={obj} />
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

export const ReportGenerationQueriesPage: React.StatelessComponent<ReportGenerationQueriesPageProps> = props => <div>
  <ChargebackNavBar match={props.match} />
  <ListPage {...props} showTitle={false} kind={ReportGenerationQueryReference} ListComponent={ReportGenerationQueriesList} canCreate={true} filterLabel={props.filterLabel} />
</div>;

const reportGenerationQueryPages = [navFactory.details(detailsPage(ReportGenerationQueriesDetails)), navFactory.editYaml()];
export const ReportGenerationQueriesDetailsPage: React.StatelessComponent<ReportGenerationQueriesDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportGenerationQueryReference} menuActions={menuActions} pages={reportGenerationQueryPages} />;
};


/* eslint-disable no-undef */
export type ReportsRowProps = {
  obj: any,
};

export type ReportsDetailsProps = {
  obj: any,
};

export type ReportDataProps = {
  obj: any,
};
export type ReportDataState = {
  error: any,
  data: any,
  inFlight: boolean,
};

export type ReportsPageProps = {
  filterLabel: string,
  match: {url: string},
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
  match: {url: string},
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
