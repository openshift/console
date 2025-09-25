import { useCallback } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { referenceForModel, K8sResourceKind } from '../module/k8s';
import { ListPage, DetailsPage, Table, TableData, RowFunctionArgs } from './factory';
import { SectionHeading, LabelList, navFactory, ResourceLink, Selector, pluralize } from './utils';
import { useConfigureCountModal } from './modals/configure-count-modal';
import { AlertmanagerModel } from '../models';

const Details: React.FCC<DetailsProps> = (props) => {
  const alertManager = props.obj;
  const { metadata, spec } = alertManager;
  const launchModal = useConfigureCountModal({
    resourceKind: AlertmanagerModel,
    resource: alertManager,
    titleKey: 'public~Edit Alertmanager replicas',
    messageKey: 'public~Alertmanager maintains the proper number of healthy replicas.',
    path: '/spec/replicas',
    buttonTextKey: 'public~Save',
  });

  const openReplicaCountModal = useCallback(
    (event) => {
      event.preventDefault();
      event.target.blur();
      launchModal();
    },
    [launchModal],
  );
  const { t } = useTranslation();

  return (
    <PaneBody>
      <SectionHeading text={t('public~Alertmanager details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>{metadata.name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Labels</DescriptionListTerm>
              <DescriptionListDescription>
                <LabelList kind="Alertmanager" labels={metadata.labels} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {spec.nodeSelector && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Alertmanager node selector')}</DescriptionListTerm>{' '}
                <DescriptionListDescription>
                  <Selector selector={spec.nodeSelector} kind="Node" />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Version</DescriptionListTerm>
              <DescriptionListDescription>{spec.version}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Replicas</DescriptionListTerm>
              <DescriptionListDescription>
                <Button
                  icon={<PencilAltIcon />}
                  iconPosition="end"
                  variant="link"
                  type="button"
                  isInline
                  onClick={openReplicaCountModal}
                >
                  {pluralize(spec.replicas, 'pod')}
                </Button>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const { details, editYaml } = navFactory;

export const AlertManagersDetailsPage = (props) => (
  <DetailsPage {...props} pages={[details(Details), editYaml()]} />
);

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-25-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg pf-v6-u-w-25-on-lg',
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
