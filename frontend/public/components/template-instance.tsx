import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared';
import { DetailsPage, ListPage, RowFunctionArgs, Table, TableData } from './factory';
import { Conditions } from './conditions';
import { getTemplateInstanceStatus, referenceFor, TemplateInstanceKind } from '../module/k8s';
import {
  EmptyBox,
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';

const menuActions = Kebab.factory.common;

const tableColumnClasses = [
  'pf-u-w-42-on-md',
  'pf-u-w-42-on-md',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-16-on-md',
  Kebab.columnClass,
];

const TemplateInstanceTableRow: React.FC<RowFunctionArgs<TemplateInstanceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind="TemplateInstance"
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={getTemplateInstanceStatus(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind="TemplateInstance" resource={obj} />
      </TableData>
    </>
  );
};

export const TemplateInstanceList: React.SFC = (props) => {
  const { t } = useTranslation();

  const TemplateInstanceTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Status'),
        sortFunc: 'getTemplateInstanceStatus',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('public~TemplateInstances')}
      Header={TemplateInstanceTableHeader}
      Row={TemplateInstanceTableRow}
      virtualize
    />
  );
};

const allStatuses = ['Ready', 'Not Ready', 'Failed'];

export const TemplateInstancePage: React.SFC<TemplateInstancePageProps> = (props) => {
  const { t } = useTranslation();

  const filters = [
    {
      filterGroupName: t('public~Status'),
      type: 'template-instance-status',
      reducer: getTemplateInstanceStatus,
      items: _.map(allStatuses, (status) => ({
        id: status,
        title: status,
      })),
    },
  ];

  return (
    <ListPage
      {...props}
      title={t('public~TemplateInstances')}
      kind="TemplateInstance"
      ListComponent={TemplateInstanceList}
      canCreate={false}
      rowFilters={filters}
    />
  );
};

const TemplateInstanceDetails: React.SFC<TemplateInstanceDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const status = getTemplateInstanceStatus(obj);
  const secretName = _.get(obj, 'spec.secret.name');
  const requester = _.get(obj, 'spec.requester.username');
  const objects = _.get(obj, 'status.objects', []);
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~TemplateInstance details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Status')}</dt>
                <dd>
                  <Status status={status} />
                </dd>
                {secretName && (
                  <>
                    <dt>{t('public~Parameters')}</dt>
                    <dd>
                      <ResourceLink
                        kind="Secret"
                        name={secretName}
                        namespace={obj.metadata.namespace}
                      />
                    </dd>
                  </>
                )}
                <dt>{t('public~Requester')}</dt>
                <dd>{requester || '-'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Objects')} />
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-6">{t('public~Name')}</div>
            <div className="col-sm-6">{t('public~Namespace')}</div>
          </div>
          <div className="co-m-table-grid__body">
            {_.isEmpty(objects) ? (
              <EmptyBox label={t('public~Objects')} />
            ) : (
              _.map(objects, ({ ref }, i) => (
                <div className="row co-resource-list__item" key={i}>
                  <div className="col-sm-6">
                    <ResourceLink
                      kind={referenceFor(ref)}
                      name={ref.name}
                      namespace={ref.namespace}
                    />
                  </div>
                  <div className="col-sm-6">
                    {ref.namespace ? <ResourceLink kind="Namespace" name={ref.namespace} /> : '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </div>
    </>
  );
};

export const TemplateInstanceDetailsPage: React.SFC<TemplateInstanceDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind="TemplateInstance"
    menuActions={menuActions}
    pages={[navFactory.details(TemplateInstanceDetails), navFactory.editYaml()]}
  />
);

type TemplateInstancePageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type TemplateInstanceDetailsProps = {
  obj: TemplateInstanceKind;
};

type TemplateInstanceDetailsPageProps = {
  match: any;
};
