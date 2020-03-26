import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { connectToFlags } from '../reducers/features';
import { FLAGS } from '@console/shared';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { coFetchJSON } from '../co-fetch';
import { ChargebackReportModel, ReportQueryModel } from '../models';
import { LoadError, LoadingInline, MsgBox } from './utils/status-box';
import { GroupVersionKind, K8sResourceKind, modelFor, referenceForModel } from '../module/k8s';
import {
  Kebab,
  DownloadButton,
  LabelList,
  NavBar,
  navFactory,
  PageHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';

export const ReportReference: GroupVersionKind = referenceForModel(ChargebackReportModel);
export const ScheduledReportReference: GroupVersionKind = 'metering.openshift.io~ScheduledReport';
export const ReportGenerationQueryReference: GroupVersionKind = referenceForModel(ReportQueryModel);

const reportPages = [
  { name: 'All Reports', href: ReportReference },
  { name: 'Report Queries', href: ReportGenerationQueryReference },
];

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(ChargebackReportModel), ...common];

const dataURL = (obj, format = 'json') => {
  return `${window.SERVER_FLAGS.meteringBaseURL}/api/v2/reports/${obj.metadata.namespace}/${obj.metadata.name}/table?format=${format}`;
};

const ChargebackNavBar: React.SFC<{ match: { url: string } }> = (props) => (
  <div>
    <PageHeading title="Chargeback Reporting" style={{ paddingBottom: 15 }} />
    <NavBar
      pages={reportPages}
      basePath={props.match.url
        .split('/')
        .slice(0, -1)
        .join('/')}
    />
  </div>
);

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-xs-4'),
  classNames('col-lg-2', 'col-md-3', 'col-xs-4'),
  classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ReportsTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Report Query',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Reporting Start',
      sortField: 'spec.reportingStart',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Reporting End',
      sortField: 'spec.reportingEnd',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
ReportsTableHeader.displayName = 'ReportsTableHeader';

const ReportsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={ReportReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          namespace={undefined}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceLink
          kind={ReportGenerationQueryReference}
          name={_.get(obj, ['spec', 'query'])}
          namespace={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={ReportReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

class ReportsDetails extends React.Component<ReportsDetailsProps> {
  render() {
    const { obj } = this.props;
    return (
      <div>
        <div className="co-m-pane__body">
          <SectionHeading text="Report Details" />
          <div className="row">
            <div className="col-sm-6 col-xs-12">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6 col-xs-12">
              <dl className="co-m-pane__details">
                <dt>Reporting Start</dt>
                <dd>
                  <Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} />
                </dd>
                <dt>Reporting End</dt>
                <dd>
                  <Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} />
                </dd>
                <dt>Report Query</dt>
                <dd>
                  <ResourceLink
                    kind={ReportGenerationQueryReference}
                    name={_.get(obj, ['spec', 'query'])}
                    namespace={obj.metadata.namespace}
                    title={obj.metadata.namespace}
                  />
                </dd>
                <dt>Run Immediately?</dt>
                <dd>{Boolean(_.get(obj, ['spec', 'runImmediately'])).toString()}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text="Conditions" />
          <Conditions conditions={_.get(obj, 'status.conditions')} />
        </div>
        <ReportData obj={obj} />
      </div>
    );
  }
}

const numericUnits = new Set([
  'bytes',
  'byte_seconds',
  'cpu_core_seconds',
  'cpu_cores',
  'memory_bytes',
  'memory_byte_seconds',
  'numeric',
  'seconds',
]);

const DataCell = ({ name, value, unit }: DataTableCellProps) => {
  if (numericUnits.has(unit)) {
    return <div className="text-right">{_.round(value, 2).toLocaleString()}</div>;
  }
  if (unit === 'date' || unit === 'time') {
    return <Timestamp timestamp={value} />;
  }
  name = _.startCase(name);
  const model = modelFor(name);
  if (model) {
    return <ResourceLink kind={name} name={value} title={value} linkTo={!model.namespaced} />;
  }
  return value;
};

const DataTable = ({ cols, rows, schema }: DataTableProps) => {
  const getUnit = (col: string) => {
    const colSchema = _.find(schema.values, { name: col });
    return _.get(colSchema, 'unit', _.isFinite(_.get(colSchema, 'value')) ? 'numeric' : null);
  };

  const DataTableHeader = () =>
    _.map(cols, (col) => {
      return {
        sortAsNumber: numericUnits.has(getUnit(col)),
        sortField: col,
        title: <span className="pf-m-wrap co-break-word">{col.replace(/_/g, ' ')}</span>,
        transforms: [sortable],
      };
    });

  const DataTableRows = ({ componentProps: { data } }: DataTableRowsProps) =>
    _.map(data, (r) =>
      _.map(r, (v, c) => {
        return { title: <DataCell name={c} value={v} unit={getUnit(c)} /> };
      }),
    );

  return (
    <Table
      aria-label="Usage Report"
      Header={DataTableHeader}
      Rows={DataTableRows}
      data={rows}
      virtualize={false}
      loaded={true}
    />
  );
};

class ReportData extends React.Component<ReportDataProps, ReportDataState> {
  constructor(props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
      data: null,
      sortBy: null,
      orderBy: null,
      cols: [],
      rows: null,
    };
  }

  fetchData() {
    this.setState(
      {
        inFlight: true,
        error: null,
        // setState is async. Re-render with inFlight = true so that we don't show a "No data" msg while data is loading
      },
      () =>
        coFetchJSON(dataURL(this.props.obj))
          .then((data) => this.makeTable(data))
          .catch((e) => this.setState({ error: e }))
          .then(() => this.setState({ inFlight: false })),
    );
  }

  componentDidMount() {
    this.fetchData();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // if request is still inFlight or props haven't changed then return
    if (this.state.inFlight || _.isEqual(this.props, nextProps)) {
      return;
    }

    const conditions = _.get(nextProps.obj, 'status.conditions');
    const isReportFinished = _.some(conditions, { type: 'Running', status: 'False' });
    if (isReportFinished) {
      this.fetchData();
    }
  }

  makeTable(data = this.state.data) {
    if (!data || _.isEmpty(data.results)) {
      return;
    }
    const cols = this.getColumns(data);
    const rows = this.getRows(data);

    this.setState({
      data,
      cols,
      rows,
    });
  }

  getColumns(data: { results: any[] }) {
    const firstRow = _.head(data.results);
    return _.map(firstRow.values, (item) => item.name);
  }

  getRows(data: { results: any[] }) {
    /* Converts data to rows:
    //  data = {
    //   results: [
    //     {
    //       values: [
    //         {
    //           name: "period_start",
    //           value: "2019-01-01T00:00:00Z",
    //           unit: "date"
    //         },
    //         {
    //           name: "pod_usage_cpu_core_seconds",
    //           value: 235.73856000000004,
    //           unit: "core_seconds"
    //         },
    //         ...
    //       ]
    //     },
    //     {
    //       values: [
    //         {
    //           name: "period_start",
    //           value: "2019-01-01T00:00:00Z",
    //           unit: "date"
    //         },
    //         {
    //           name: "pod_usage_cpu_core_seconds",
    //           value: 21.864000000000004,
    //           unit: "core_seconds"
    //
    //   ... to ...
    //
    //   rows = [
    //   {
    //   "period_start": "2019-01-01T00:00:00Z",
    //   "pod_usage_cpu_core_seconds": 235.73856000000004
    //   ...
    //  },
    //  {
    //   "period_start": "2019-01-01T00:00:00Z",
    //   "pod_usage_cpu_core_seconds": 21.864000000000004
    //   ...
    //  },
    //  ...
     */
    const rows = _.map(data.results, ({ values }) => {
      return _.reduce(
        values,
        (acc, { name, value }) => {
          acc[name] = value;
          return acc;
        },
        {},
      );
    });

    return rows;
  }

  render() {
    const { obj } = this.props;
    const { data, cols, rows, inFlight, error } = this.state;

    let dataElem = <MsgBox title="No Data" detail="Report contains no results." />;
    if (inFlight) {
      dataElem = (
        <div className="row">
          <div className="col-xs-12 text-center">
            <LoadingInline />
          </div>
        </div>
      );
    } else if (error) {
      dataElem = <LoadError label="Report" message={_.get(error, 'json.error') || error.message} />;
    } else if (data) {
      if (data.error) {
        dataElem = <LoadError label="Report" message={data.error} />;
      } else {
        dataElem = <DataTable cols={cols} rows={rows} schema={_.head(data.results)} />;
      }
    }
    const format = 'csv';
    const downloadURL = dataURL(obj, format);

    return (
      <div className="co-m-pane__body">
        <SectionHeading text="Usage Report" />
        <DownloadButton url={downloadURL} />
        {dataElem}
      </div>
    );
  }
}

const reportsPages = [navFactory.details(ReportsDetails), navFactory.editYaml()];

const EmptyMsg = () => (
  <MsgBox
    title="No reports have been generated"
    detail="Reports allow resource usage and cost to be tracked per namespace, pod, and more."
  />
);

export const ReportsList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Reports"
    Header={ReportsTableHeader}
    Row={ReportsTableRow}
    EmptyMsg={EmptyMsg}
    virtualize
  />
);

const ReportsPage_: React.SFC<ReportsPageProps> = (props) => {
  return (
    <div>
      <ChargebackNavBar match={props.match} />
      <ListPage
        {...props}
        showTitle={false}
        kind={ReportReference}
        ListComponent={ReportsList}
        canCreate={true}
      />
    </div>
  );
};

export const ReportsPage = connectToFlags(FLAGS.CHARGEBACK)(ReportsPage_);

export const ReportsDetailsPage: React.SFC<ReportsDetailsPageProps> = (props) => {
  return (
    <DetailsPage {...props} kind={ReportReference} menuActions={menuActions} pages={reportsPages} />
  );
};

const reportsGenerationColumnClasses = [
  classNames('col-md-3', 'col-sm-4'),
  classNames('col-md-3', 'col-sm-4'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-3', 'col-sm-4'),
  Kebab.columnClass,
];

const ReportGenerationQueriesTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: reportsGenerationColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: reportsGenerationColumnClasses[1] },
    },
    {
      title: 'Labels',
      props: { className: reportsGenerationColumnClasses[2] },
    },
    {
      title: 'Created At',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: reportsGenerationColumnClasses[3] },
    },
    {
      title: '',
      props: { className: reportsGenerationColumnClasses[4] },
    },
  ];
};
ReportGenerationQueriesTableHeader.displayName = 'ReportGenerationQueriesTableHeader';

const ReportGenerationQueriesTableRow: RowFunction<K8sResourceKind> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={reportsGenerationColumnClasses[0]}>
        <ResourceLink
          kind={ReportGenerationQueryReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={reportsGenerationColumnClasses[1]}>
        <ResourceLink
          kind="Namespace"
          namespace={undefined}
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={reportsGenerationColumnClasses[2]}>
        <LabelList
          kind={ReportGenerationQueryReference}
          labels={_.get(obj, ['metadata', 'labels'])}
        />
      </TableData>
      <TableData className={reportsGenerationColumnClasses[3]}>
        <Timestamp timestamp={_.get(obj, ['metadata', 'creationTimestamp'])} />
      </TableData>
      <TableData className={reportsGenerationColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={ReportGenerationQueryReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ReportGenerationQueriesDetails: React.SFC<ReportGenerationQueriesDetailsProps> = ({
  obj,
}) => {
  const columns = _.get(obj, ['spec', 'columns'], []).map((column, i) => (
    <tr key={i}>
      <td>{column.name}</td>
      <td>{column.type}</td>
    </tr>
  ));

  return (
    <div>
      <div className="co-m-pane__body">
        <SectionHeading text="Chargeback Report Generation Query" />
        <ResourceSummary resource={obj}>
          <dt>Query</dt>
          <dd>
            <pre>
              <code>{_.get(obj, ['spec', 'query'])}</code>
            </pre>
          </dd>
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
                  <tbody>{columns}</tbody>
                </table>
              </div>
            </div>
          </div>
        </ResourceSummary>
      </div>
    </div>
  );
};

export const ReportGenerationQueriesList: React.SFC = (props) => (
  <Table
    aria-label="Chargeback Queries List"
    {...props}
    Header={ReportGenerationQueriesTableHeader}
    Row={ReportGenerationQueriesTableRow}
    virtualize
  />
);

export const ReportGenerationQueriesPage: React.SFC<ReportGenerationQueriesPageProps> = (props) => (
  <div>
    <ChargebackNavBar match={props.match} />
    <ListPage
      {...props}
      showTitle={false}
      kind={ReportGenerationQueryReference}
      ListComponent={ReportGenerationQueriesList}
      canCreate={true}
      filterLabel={props.filterLabel}
    />
  </div>
);

const reportGenerationQueryPages = [
  navFactory.details(ReportGenerationQueriesDetails),
  navFactory.editYaml(),
];
export const ReportGenerationQueriesDetailsPage: React.SFC<ReportGenerationQueriesDetailsPageProps> = (
  props,
) => {
  return (
    <DetailsPage
      {...props}
      kind={ReportGenerationQueryReference}
      menuActions={menuActions}
      pages={reportGenerationQueryPages}
    />
  );
};

export type ReportsDetailsProps = {
  obj: any;
};

export type ReportDataProps = {
  obj: any;
};
export type ReportDataState = {
  error: any;
  data: any;
  inFlight: boolean;
  sortBy: string;
  orderBy: string;
  cols: string[];
  rows: any[];
};

export type DataTableProps = {
  rows: any[];
  cols: string[];
  schema: any;
};

export type DataTableCellProps = {
  name: string;
  value: any;
  unit: string;
};

export type DataTableRowsProps = {
  componentProps: { data: any[] };
};

export type ReportsPageProps = {
  filterLabel: string;
  flags: { [_: string]: boolean };
  match: { url: string };
};

export type ReportsDetailsPageProps = {
  match: any;
};

export type ReportGenerationQueriesRowProps = {
  obj: any;
};

export type ReportGenerationQueriesDetailsProps = {
  obj: any;
};

export type ReportGenerationQueriesPageProps = {
  filterLabel: string;
  match: { url: string };
};

export type ReportGenerationQueriesDetailsPageProps = {
  match: any;
};

ReportsList.displayName = 'ReportsList';
ReportsPage.displayName = 'ReportsPage';
ReportsDetailsPage.displayName = 'ReportsDetailsPage';

ReportGenerationQueriesDetails.displayName = 'ReportGenerationQueriesDetails';
ReportGenerationQueriesList.displayName = 'ReportGenerationQueriesList';
ReportGenerationQueriesPage.displayName = 'ReportGenerationQueriesPage';
ReportGenerationQueriesDetailsPage.displayName = 'ReportGenerationQueriesDetailsPage';
