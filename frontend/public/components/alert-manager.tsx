import * as React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { DASH } from '@console/shared/src/constants/ui';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { referenceForModel, K8sResourceKind, TableColumn } from '../module/k8s';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import {
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { SectionHeading } from './utils/headings';
import { LabelList } from './utils/label-list';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { Selector } from './utils/selector';
import { pluralize } from './utils/details-page';
import { useConfigureCountModal } from './modals/configure-count-modal';
import { AlertmanagerModel } from '../models';
import { LoadingBox } from './utils/status-box';

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
const kind = referenceForModel(AlertmanagerModel);

export const AlertManagersDetailsPage = (props) => (
  <DetailsPage {...props} pages={[details(Details), editYaml()]} />
);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'version' },
  { id: 'nodeSelector' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj: alertManager }) => {
    const { metadata, spec } = alertManager;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(AlertmanagerModel)}
            name={metadata.name}
            namespace={metadata.namespace}
            title={metadata.uid}
          />
        ),
        props: getNameCellProps(metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind={AlertmanagerModel.kind} labels={metadata.labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: spec.version || DASH,
      },
      [tableColumnInfo[4].id]: {
        cell: <Selector selector={spec.nodeSelector} kind="Node" />,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useAlertManagerColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Version'),
        id: tableColumnInfo[3].id,
        sort: 'spec.version',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Node selector'),
        id: tableColumnInfo[4].id,
        sort: 'spec.nodeSelector',
        props: {
          modifier: 'nowrap',
        },
      },
    ];
  }, [t]);
  return columns;
};

const AlertManagersList: React.FCC<AlertManagersListProps> = ({ data, loaded, ...props }) => {
  const columns = useAlertManagerColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={AlertmanagerModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const AlertManagersPage = (props) => (
  <ListPage
    {...props}
    ListComponent={AlertManagersList}
    canCreate={false}
    kind={kind}
    omitFilterToolbar={true}
  />
);

type DetailsProps = {
  obj: K8sResourceKind;
};

type AlertManagersListProps = {
  data: K8sResourceKind[];
  loaded: boolean;
  [key: string]: any;
};
