import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { Button, EmptyState, EmptyStateSecondaryActions, Title } from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { QuickStartModel } from '@console/app/src/models';
import {
  ListPage,
  Table,
  TableData,
  TableRow,
  RowFunction,
} from '@console/internal/components/factory';
import { history, Kebab, ResourceKebab, ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ALL_NAMESPACES_KEY,
  dimensifyHeader,
  dimensifyRow,
  getName,
  getNamespace,
  getUID,
  useActiveNamespace,
} from '@console/shared';
import { NetworkAttachmentDefinitionModel } from '../../models';
import { getConfigAsJSON, getType } from '../../selectors';
import { NetworkAttachmentDefinitionKind } from '../../types';
import { NetAttachDefBundle, NetworkAttachmentDefinitionsPageProps } from './types';

import './NetworkAttachmentDefinition.scss';

const { common } = Kebab.factory;
const menuActions = [...common];

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  Kebab.columnClass,
];

const NetworkAttachmentDefinitionsHeader = () =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'name',
        transforms: [sortable],
      },
      {
        title: 'Namespace',
        sortField: 'namespace',
        transforms: [sortable],
      },
      {
        title: 'Type',
        sortField: 'type',
        transforms: [sortable],
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

const NetworkAttachmentDefinitionsRow: RowFunction<NetAttachDefBundle> = ({
  obj: { name, namespace, type, metadata, netAttachDef },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);

  return (
    <TableRow id={metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={referenceForModel(NetworkAttachmentDefinitionModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        {type || <span className="text-secondary">Not available</span>}
      </TableData>
      <TableData className={dimensify(true)}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(NetworkAttachmentDefinitionModel)}
          resource={netAttachDef}
        />
      </TableData>
    </TableRow>
  );
};

const getNetAttachDefsData = (nadList: NetworkAttachmentDefinitionKind[]): NetAttachDefBundle[] => {
  return nadList
    ? nadList.map((netAttachDef) => {
        const configJSON = getConfigAsJSON(netAttachDef);
        return {
          netAttachDef,
          metadata: { uid: getUID(netAttachDef) },
          configJSON,
          // for sorting
          name: getName(netAttachDef),
          namespace: getNamespace(netAttachDef),
          type: getType(configJSON),
        };
      })
    : [];
};

const getCreateLink = (namespace: string): string =>
  `/k8s/ns/${namespace || 'default'}/${referenceForModel(
    NetworkAttachmentDefinitionModel,
  )}/~new/form`;

const NADListEmpty: React.FC = () => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();

  const searchText = 'network attachment definition';
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    kind: referenceForModel(QuickStartModel),
    isList: true,
  });
  const hasQuickStarts =
    quickStartsLoaded &&
    quickStarts.find(
      ({ spec: { displayName, description } }) =>
        displayName.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText),
    );

  return (
    <EmptyState>
      <Title headingLevel="h4" size="lg">
        {t('kubevirt-plugin~No network attachment definitions found')}
      </Title>
      <Button
        data-test-id="create-nad-empty"
        variant="primary"
        onClick={() =>
          history.push(getCreateLink(namespace === ALL_NAMESPACES_KEY ? undefined : namespace))
        }
      >
        {t('kubevirt-plugin~Create network attachment definition')}
      </Button>
      {hasQuickStarts && (
        <EmptyStateSecondaryActions>
          <Button
            data-test-id="nad-quickstart"
            variant="secondary"
            onClick={() => history.push('/quickstart?keyword=network+attachment+definition')}
          >
            <RocketIcon className="nad-quickstart-icon" />
            {t('kubevirt-plugin~Learn how to use network attachment definitions')}
          </Button>
        </EmptyStateSecondaryActions>
      )}
    </EmptyState>
  );
};

export const NetworkAttachmentDefinitionsList: React.FC<React.ComponentProps<typeof Table>> = (
  props,
) => {
  return (
    <Table
      data={getNetAttachDefsData(props.data)}
      aria-label={NetworkAttachmentDefinitionModel.labelPlural}
      Header={NetworkAttachmentDefinitionsHeader}
      Row={NetworkAttachmentDefinitionsRow}
      virtualize
      loaded={props.loaded}
      label={props.label}
      EmptyMsg={NADListEmpty}
    />
  );
};
NetworkAttachmentDefinitionsList.displayName = 'NetworkAttachmentDefinitionsList';

export const NetworkAttachmentDefinitionsPage: React.FC<NetworkAttachmentDefinitionsPageProps> = (
  props,
) => {
  const namespace = props.namespace || props.match?.params?.ns;
  const createProps = {
    to: getCreateLink(namespace),
  };

  return (
    <ListPage
      {...props}
      title={NetworkAttachmentDefinitionModel.labelPlural}
      kind={referenceForModel(NetworkAttachmentDefinitionModel)}
      ListComponent={NetworkAttachmentDefinitionsList}
      filterLabel={props.filterLabel}
      canCreate
      createProps={createProps}
    />
  );
};
NetworkAttachmentDefinitionsPage.displayName = 'NetworkAttachmentDefinitionsPage';

export default NetworkAttachmentDefinitionsPage;
