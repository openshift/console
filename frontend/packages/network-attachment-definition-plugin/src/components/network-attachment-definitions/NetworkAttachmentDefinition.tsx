import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons/dist/esm/icons/rocket-icon';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { QuickStartModel } from '@console/app/src/models';
import { ListPage, Table, TableData, RowFunctionArgs } from '@console/internal/components/factory';
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

const tableColumnClasses = ['', 'pf-m-hidden pf-m-visible-on-md', '', Kebab.columnClass];

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

const NetworkAttachmentDefinitionsRow: React.FC<RowFunctionArgs<NetAttachDefBundle>> = ({
  obj: { name, namespace, type, netAttachDef },
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);

  return (
    <>
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
    </>
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
      <EmptyStateHeader
        titleText={<>{t('kubevirt-plugin~No network attachment definitions found')}</>}
        headingLevel="h4"
      />
      <EmptyStateFooter>
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
          <EmptyStateActions>
            <Button
              data-test-id="nad-quickstart"
              variant="secondary"
              onClick={() => history.push('/quickstart?keyword=network+attachment+definition')}
            >
              <RocketIcon className="nad-quickstart-icon" />
              {t('kubevirt-plugin~Learn how to use network attachment definitions')}
            </Button>
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
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
      loadError={props.loadError}
      label={props.label}
      EmptyMsg={NADListEmpty}
    />
  );
};
NetworkAttachmentDefinitionsList.displayName = 'NetworkAttachmentDefinitionsList';

export const NetworkAttachmentDefinitionsPage: React.FC<NetworkAttachmentDefinitionsPageProps> = (
  props,
) => {
  const params = useParams();
  const namespace = props.namespace || params?.ns;
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
