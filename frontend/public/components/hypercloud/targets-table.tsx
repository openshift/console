import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { EmptyBox, SectionHeading } from '../utils';
import { Table, TableRow, TableData } from '../hypercloud/factory/table';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { SecretValue } from './image-signer-key';
import { useTranslation } from 'react-i18next';

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

const TargetsTableRows = props => {
  const { obj, index, key, style, reveal } = props;
  console.log(obj);
  return (
    <TableRow id={'target-table'} index={index} trKey={key} style={style}>
      <TableData className={targetRowColumnClasses[0]}>{<SecretValue encoded={false} value={obj.id} reveal={true} isTable={true}></SecretValue>}</TableData>
      <TableData className={classNames(targetRowColumnClasses[1])}>
        <SecretValue value={obj.key} reveal={reveal} isTable={true}></SecretValue>
      </TableData>
      <TableData className={classNames(targetRowColumnClasses[2])}>
        <SecretValue value={obj.passPhrase} reveal={reveal} isTable={true}></SecretValue>
      </TableData>
    </TableRow>
  );
};

export const TargetsTable = props => {
  const { t } = useTranslation();
  const { resource, ...tableProps } = props;
  const [reveal, setReveal] = React.useState(false);
  const data: RowTargetData[] = resource;
  return (
    <>
      {props.heading && (
        <SectionHeading text={props.heading}>
          {resource.length ? (
            <Button type="button" onClick={() => setReveal(!reveal)} variant="link" className="pf-m-link--align-right">
              {reveal ? (
                <>
                  <EyeSlashIcon className="co-icon-space-r" />
                  {`${t('COMMON:MSG_DETAILS_TABSIGNERKEY_3')}`}
                </>
              ) : (
                <>
                  <EyeIcon className="co-icon-space-r" />
                  {`${t('COMMON:MSG_DETAILS_TABSIGNERKEY_2')}`}
                </>
              )}
            </Button>
          ) : null}
        </SectionHeading>
      )}
      {resource.length <= 0 ? <EmptyBox label="Targets" /> : <Table {...tableProps} aria-label="Targets" loaded={true} reveal={reveal} label={props.heading} data={data} Header={TargetsTableHeader} Row={TargetsTableRows} virtualize={true} />}
    </>
  );
};

TargetsTable.displayName = 'TargetsTable';

export type RowTargetData = {
  [index: string]: string;
};

// type SecretValueProps = {
//   value: string;
//   encoded?: boolean;
//   reveal: boolean;
// };
