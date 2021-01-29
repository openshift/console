import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { EnvoyFilterModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(EnvoyFilterModel), ...Kebab.factory.common];

const kind = EnvoyFilterModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const EnvoyFilterTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
EnvoyFilterTableHeader.displayName = 'EnvoyFilterTableHeader';

const EnvoyFilterTableRow: RowFunction<K8sResourceKind> = ({ obj: envoyfilter, index, key, style }) => {
  return (
    <TableRow id={envoyfilter.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={envoyfilter.metadata.name} namespace={envoyfilter.metadata.namespace} title={envoyfilter.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={envoyfilter.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={envoyfilter.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={envoyfilter} />
      </TableData>
    </TableRow>
  );
};

const EnvoyFilterDetails: React.FC<EnvoyFilterDetailsProps> = ({ obj: envoyfilter }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_38')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={envoyfilter} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const EnvoyFilters: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Envoy Filters" Header={EnvoyFilterTableHeader.bind(null, t)} Row={EnvoyFilterTableRow} virtualize />;
};

export const EnvoyFiltersPage: React.FC<EnvoyFiltersPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_38')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_38') })} canCreate={true} ListComponent={EnvoyFilters} kind={kind} {...props} />;
};

export const EnvoyFiltersDetailsPage: React.FC<EnvoyFiltersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(EnvoyFilterDetails)), editYaml()]} />;

type EnvoyFilterDetailsProps = {
  obj: K8sResourceKind;
};

type EnvoyFiltersPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type EnvoyFiltersDetailsPageProps = {
  match: any;
};