import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, NavBar, NavTitle, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp, LabelList, DownloadButton } from './utils';
import { LoadingInline, MsgBox } from './utils/status-box';
import { getQueryArgument, setQueryArgument } from './utils/router';
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
      <Heading text="Report Overview" />
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true} />
          </div>
          <div className="col-sm-6 col-xs-12">
            <dl>
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
            </dl>
          </div>
        </div>
      </div>
      <ReportData obj={obj} />
    </div>;
  }
}

const reducerCols = ['namespace', 'node', 'pod'];
const colsBlacklist = new Set(['data_start', 'data_end']);

const DataCell = ({name, value}) => {
  if (_.isFinite(value)) {
    return _.round(value, 2);
  }
  name = _.startCase(name);
  const model = modelFor(name);
  if (model) {
    return <ResourceLink kind={name} name={value} title={value} linkTo={!model.namespaced} />;
  }
  return value;
};

class ReportData extends React.Component<ReportDataProps, ReportDataState> {
  constructor (props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
      data: null,
      reduceBy: null,
      sortBy: null,
      orderBy: null,
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

  componentWillMount () {
    const sortBy = getQueryArgument('sortBy') || 'namespace';
    const reduceBy = getQueryArgument('reduceBy') || 'namespace';
    const orderBy = getQueryArgument('orderBy') || (sortBy === 'namespace' ? 'asc' : 'desc');
    this.setState({
      sortBy,
      reduceBy,
      orderBy,
    });
    this.fetchData();
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.inFlight || this.state.data) {
      return;
    }
    const phase = _.get(nextProps.obj, ['status', 'phase']);
    // const oldPhase = _.get(this.props.obj, ['status', 'phase']);
    if (phase === 'Finished') {
      this.fetchData();
    }
  }

  orderBy (col) {
    this.setState({orderBy: col});
    setQueryArgument('orderBy', col);
  }

  reduceBy (col) {
    if (reducerCols.indexOf(this.state.sortBy) >= 0) {
      // Sort field is going away. Sort by new field.
      this.sortBy(col);
    }
    setQueryArgument('reduceBy', col);
    this.setState({reduceBy: col});
  }

  sortBy (col) {
    this.setState({sortBy: col});
    setQueryArgument('sortBy', col);
  }

  filterKeys () {
    const {data=[], reduceBy} = this.state;
    const keys = _.keys(data[0]).filter(k => {
      if (k === reduceBy) {
        return true;
      }
      if (colsBlacklist.has(k)) {
        return false;
      }
      if (reducerCols.indexOf(k) >= 0) {
        return false;
      }
      return true;
    });
    return keys;
  }

  transformData () {
    const {data, reduceBy, sortBy, orderBy} = this.state;
    const reducedData = {};
    _.each(data, row => {
      const key = row[reduceBy];
      if (!reducedData[key]) {
        reducedData[key] = {};
      }
      _.each(row, (v, k) => {
        if (!isFinite(v as (any))) {
          return;
        }
        if (!reducedData[key][k]) {
          reducedData[key][k] = 0;
        }
        reducedData[key][k] += v;
      });
    });
    const rows = _.chain(reducedData).map((o, key) => ({[reduceBy]: key, ...o})).orderBy(sortBy, orderBy).value();
    return rows;
  }

  render () {
    const {obj} = this.props;
    const phase = _.get(obj, ['status', 'phase']);

    const applySort = (sortBy, func, orderBy) => {
      this.sortBy(sortBy);
      this.orderBy(orderBy);
    };
    const {data, reduceBy, sortBy, orderBy} = this.state;

    let dataElem = <MsgBox title="No Data" detail="Report not finished running." />;
    if (phase === 'Finished') {
      if (data) {
        const keys = this.filterKeys();
        const rows = this.transformData();
        const className = `col-xs-${Math.floor(12 / _.size(rows[0]))}`;
        dataElem = <div className="co-m-table-grid co-m-table-grid--bordered" style={{marginTop: 20}}>
          <ListHeader>{_.map(keys, k => <ColHead className={className} key={k} sortField={k} sortFunc={k} currentSortOrder={orderBy} currentSortField={sortBy} currentSortFunc={sortBy} applySort={applySort}>{k.replace(/_/g, ' ')}</ColHead>)}</ListHeader>
          <div className="co-m-table-grid__body">
            {_.map(rows, (r, i) => <div className="row co-resource-list__item" key={i}>
              {_.map(r, (v, k) => <div className={className} key={k}><DataCell name={k} value={v} /></div>)}
            </div>)}
          </div>
        </div>;
      } else {
        dataElem = <LoadingInline />;
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
            <div className="btn-group">
              {_.map(reducerCols, col => <button key={col} onClick={() => this.reduceBy(col)} className={classNames(['btn', 'btn-default'], {'btn-selected': col === reduceBy})}>By {_.startCase(col)}</button>)}
            </div>
          </div>
        </div>
        { dataElem }
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
  reduceBy: string,
  sortBy: string,
  orderBy: string,
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
