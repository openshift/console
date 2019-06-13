import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, ContainerTable, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { ResourceEventStream } from './events';

const { common } = Kebab.factory;
const menuActions = [...common];

const kind = 'CronJob';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const CronJobTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Schedule', sortField: 'spec.schedule', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Concurrency Policy', sortField: 'spec.schedule', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Starting Deadline Seconds', sortField: 'spec.schedule', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
CronJobTableHeader.displayName = 'CronJobTableHeader';

const CronJobTableRow = ({obj: cronjob, index, key, style}) => {
  return (
    <TableRow id={cronjob.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={cronjob.metadata.name} title={cronjob.metadata.name} namespace={cronjob.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={cronjob.metadata.namespace} title={cronjob.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {cronjob.spec.schedule}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(cronjob.spec, 'concurrencyPolicy', '-')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={cronjob} />
      </TableData>
    </TableRow>
  );
};
CronJobTableRow.displayName = 'CronJobTableRow';

const Details = ({obj: cronjob}) => {
  const job = cronjob.spec.jobTemplate;
  return <React.Fragment>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-6">
          <SectionHeading text="CronJob Overview" />
          <ResourceSummary resource={cronjob}>
            <dt>Schedule</dt>
            <dd>{cronjob.spec.schedule}</dd>
            <dt>Concurrency Policy</dt>
            <dd>{cronjob.spec.concurrencyPolicy || '-'}</dd>
            <dt>Starting Deadline Seconds</dt>
            <dd>{cronjob.spec.startingDeadlineSeconds || '-'}</dd>
            <dt>Last Schedule Time</dt>
            <dd><Timestamp timestamp={cronjob.status.lastScheduleTime} /></dd>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <SectionHeading text="Job Overview" />
          <dl className="co-m-pane__details">
            <dt>Desired Completions</dt>
            <dd>{job.spec.completions || '-'}</dd>
            <dt>Parallelism</dt>
            <dd>{job.spec.parallelism || '-'}</dd>
            <dt>Deadline</dt>
            <dd>{job.spec.activeDeadlineSeconds ? `${job.spec.activeDeadlineSeconds} seconds` : '-'}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={job.spec.template.spec.containers} />
    </div>
  </React.Fragment>;
};

export const CronJobsList = props => <Table {...props} aria-label="Cron Jobs" Header={CronJobTableHeader} Row={CronJobTableRow} virtualize />;

export const CronJobsPage = props => <ListPage {...props} ListComponent={CronJobsList} kind={kind} canCreate={true} />;

export const CronJobsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.events(ResourceEventStream)]}
/>;
