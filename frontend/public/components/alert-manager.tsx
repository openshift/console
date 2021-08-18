import * as React from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

import { referenceForModel, K8sResourceKind } from '../module/k8s';
import { ListPage, DetailsPage, Table, TableData, RowFunctionArgs } from './factory';
import { SectionHeading, LabelList, navFactory, ResourceLink, Selector, pluralize } from './utils';
import { configureReplicaCountModal } from './modals';
import { AlertmanagerModel } from '../models';

const Details: React.SFC<DetailsProps> = (props) => {
  const alertManager = props.obj;
  const { metadata, spec } = alertManager;

  const openReplicaCountModal = (event) => {
    event.preventDefault();
    event.target.blur();
    configureReplicaCountModal({ resourceKind: AlertmanagerModel, resource: alertManager });
  };
  const { t } = useTranslation();

  return (
    <div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Alertmanager details')} />
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Name</dt>
              <dd>{metadata.name}</dd>
              <dt>Labels</dt>
              <dd>
                <LabelList kind="Alertmanager" labels={metadata.labels} />
              </dd>
              {spec.nodeSelector && <dt>{t('public~Alertmanager node selector')}</dt>}
              {spec.nodeSelector && (
                <dd>
                  <Selector selector={spec.nodeSelector} kind="Node" />
                </dd>
              )}
            </dl>
          </div>
          <div className="col-sm-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Version</dt>
              <dd>{spec.version}</dd>
              <dt>Replicas</dt>
              <dd>
                <Button variant="link" type="button" isInline onClick={openReplicaCountModal}>
                  {pluralize(spec.replicas, 'pod')}
                  <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                </Button>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const { details, editYaml } = navFactory;

export const AlertManagersDetailsPage = (props) => (
  <DetailsPage {...props} pages={[details(Details), editYaml()]} />
);

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-25-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-25-on-lg',
];

const AlertManagerTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({
  obj: alertManager,
}) => {
  const { metadata, spec } = alertManager;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(AlertmanagerModel)}
          name={metadata.name}
          namespace={metadata.namespace}
          title={metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={AlertmanagerModel.kind} labels={metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{spec.version}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={spec.nodeSelector} kind="Node" />
      </TableData>
    </>
  );
};

const AlertManagerTableHeader = () => {
  return [
    {
      title: i18next.t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18next.t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: i18next.t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18next.t('public~Version'),
      sortField: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18next.t('public~Node selector'),
      sortField: 'spec.nodeSelector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};
AlertManagerTableHeader.displayName = 'AlertManagerTableHeader';

const AlertManagersList = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('public~Alertmanagers')}
      Header={AlertManagerTableHeader}
      Row={AlertManagerTableRow}
      virtualize
    />
  );
};

export const AlertManagersPage = (props) => (
  <ListPage
    {...props}
    ListComponent={AlertManagersList}
    canCreate={false}
    kind={referenceForModel(AlertmanagerModel)}
  />
);

type DetailsProps = {
  obj: K8sResourceKind;
};
