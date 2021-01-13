import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { EmptyBox, SectionHeading } from '../utils';
import { Table } from '../factory';
import { sortable } from '@patternfly/react-table';

const targetRowColumnClasses = [classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-5'), classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-7'), classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs')];

const TargetsTableHeader = () => {
  return [
    {
      title: 'ID',
      sortField: 'id',
      transforms: [sortable],
      props: { className: targetRowColumnClasses[0] },
    },
    {
      title: 'Key',
      sortField: 'key',
      transforms: [sortable],
      props: { className: targetRowColumnClasses[1] },
    },
    {
      title: 'PassPhrase',
      sortField: 'passPhrase',
      transforms: [sortable],
      props: { className: targetRowColumnClasses[2] },
    },
  ];
};
TargetsTableHeader.displayName = 'TargetsTableHeader';

const TargetsTableRows = ({ componentProps: { data } }) => {
  return _.map(data, (target: RowTargetData) => {
    const { id, key, passPhrase } = target;
    return [
      {
        title: id,
        props: {
          className: targetRowColumnClasses[0],
        },
      },
      {
        title: key,
        props: {
          className: targetRowColumnClasses[1],
        },
      },
      {
        title: passPhrase || <span className="text-muted">No passPhrase</span>,
        props: {
          className: targetRowColumnClasses[2],
        },
      },
    ];
  });
};

export const TargetsTable = props => {
  const { resource, ...tableProps } = props;
  console.log(resource);
  const data: RowTargetData[] = resource;
  return (
    <>
      {props.heading && <SectionHeading text={props.heading} />}
      {resource.length <= 0 ? <EmptyBox label="Targets" /> : <Table {...tableProps} aria-label="Targets" loaded={true} label={props.heading} data={data} Header={TargetsTableHeader} Rows={TargetsTableRows} virtualize={false} />}
    </>
  );
};

TargetsTable.displayName = 'TargetsTable';

export type RowTargetData = {
  [index: string]: string;
};
