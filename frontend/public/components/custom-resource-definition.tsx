import * as _ from 'lodash-es';
import * as React from 'react';
import {
  SortByDirection,
  TableVariant,
  Table as PfTable,
  Thead,
  Tbody,
  Td,
  Th,
  Tr,
} from '@patternfly/react-table';
import { BanIcon } from '@patternfly/react-icons/dist/esm/icons/ban-icon';
import { useTranslation } from 'react-i18next';

import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { sortResourceByValue } from './factory/Table/sort';
import { AsyncComponent } from './utils/async';
import { DetailsItem } from './utils/details-item';
import { EmptyBox, LoadingBox } from './utils/status-box';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import {
  apiVersionCompare,
  CRDVersion,
  CustomResourceDefinitionKind,
  getLatestVersionForCRD,
  K8sModel,
  referenceForCRD,
  referenceForModel,
  TableColumn,
} from '../module/k8s';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { CustomResourceDefinitionModel } from '../models';
import { Conditions } from './conditions';
import { getResourceListPages } from './resource-pages';
import { DefaultPage } from './default-resource';
import { GreenCheckCircleIcon } from '@console/shared/src/components/status/icons';
import { DASH } from '@console/shared/src/constants/ui';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  ResourceListPage,
  isResourceListPage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';

const isEstablished = (conditions: any[]) => {
  const condition = _.find(conditions, (c) => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = (crd: CustomResourceDefinitionKind) => crd.spec.scope === 'Namespaced';

const kind = referenceForModel(CustomResourceDefinitionModel);

const Established: React.FC<{ crd: CustomResourceDefinitionKind }> = ({ crd }) => {
  const { t } = useTranslation();
  return crd.status && isEstablished(crd.status.conditions) ? (
    <span>
      <GreenCheckCircleIcon title={t('public~true')} />
    </span>
  ) : (
    <span>
      <BanIcon title={t('public~false')} />
    </span>
  );
};

const EmptyVersionsMsg: React.FC<{}> = () => {
  const { t } = useTranslation();
  return <EmptyBox label={t('public~CRD versions')} />;
};

const CRDVersionTable: React.FC<CRDVersionProps> = ({ versions }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState({ index: 0, direction: SortByDirection.asc });
  const onSort = React.useCallback(
    (_event, index, direction) => setSortBy({ index, direction }),
    [],
  );
  const compare = React.useCallback(
    (a, b) => {
      const { index, direction } = sortBy;
      const descending = direction === SortByDirection.desc;
      const left = (descending ? b : a)?.[index] ?? '';
      const right = (descending ? a : b)?.[index] ?? '';
      return index === 0 ? apiVersionCompare(left, right) : left.localeCompare(right);
    },
    [sortBy],
  );

  const versionRows = React.useMemo(
    () =>
      versions
        .map(({ name, served, storage }: CRDVersion) => [
          name,
          served?.toString?.(),
          storage?.toString?.(),
        ])
        .sort(compare),
    [versions, compare],
  );

  const headers = React.useMemo(() => [t('public~Name'), t('public~Served'), t('public~Storage')], [
    t,
  ]);

  return versionRows.length > 0 ? (
    <PfTable variant={TableVariant.compact} aria-label={t('public~CRD versions')}>
      <Thead>
        <Tr>
          {headers.map((header, columnIndex) => (
            <Th key={header} sort={{ sortBy, onSort, columnIndex }}>
              {header}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {versionRows.map(([name, served, storage]) => (
          <Tr key={name}>
            <Td>{name}</Td>
            <Td>{served}</Td>
            <Td>{storage}</Td>
          </Tr>
        ))}
      </Tbody>
    </PfTable>
  ) : (
    <EmptyVersionsMsg />
  );
};

const Details: React.FC<{ obj: CustomResourceDefinitionKind }> = ({ obj: crd }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~CustomResourceDefinition details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary showPodSelector={false} showNodeSelector={false} resource={crd} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Established')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Established crd={crd} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DetailsItem label={t('public~Group')} obj={crd} path="spec.group" />
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Latest version')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {getLatestVersionForCRD(crd)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DetailsItem label={t('public~Scope')} obj={crd} path="spec.scope" />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={crd.status.conditions} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Versions')} />
        <CRDVersionTable versions={crd.spec.versions} />
      </PaneBody>
    </>
  );
};

const Instances: React.FC<InstancesProps> = ({ obj, namespace }) => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const crdKind = referenceForCRD(obj);
  const componentLoader = getResourceListPages(resourceListPageExtensions).get(crdKind, () =>
    Promise.resolve(DefaultPage),
  );
  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={namespace ? namespace : undefined}
      kind={crdKind}
      showTitle={false}
      autoFocus={false}
    />
  );
};

const tableColumnInfo = [
  { id: 'name' },
  { id: 'group' },
  { id: 'lastestVersion' },
  { id: 'namespaced' },
  { id: 'established' },
  { id: '' },
];

const useCustomResourceDefinitionsColumns = (): TableColumn<CustomResourceDefinitionKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<CustomResourceDefinitionKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'spec.names.kind',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Group'),
        id: tableColumnInfo[1].id,
        sort: 'spec.group',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Latest version'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<CustomResourceDefinitionKind>(direction, getLatestVersionForCRD),
          ),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespaced'),
        id: tableColumnInfo[3].id,
        sort: 'spec.scope',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Established'),
        id: tableColumnInfo[4].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const IsNamespaced: React.FCC<{ obj: CustomResourceDefinitionKind }> = ({ obj }) => {
  const { t } = useTranslation();
  return namespaced(obj) ? t('public~Yes') : t('public~No');
};

const getDataViewRows: GetDataViewRows<CustomResourceDefinitionKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const displayName = _.get(obj, 'spec.names.kind');

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <span className="co-resource-item">
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(CustomResourceDefinitionModel)}
              name={name}
              namespace={namespace}
              displayName={displayName}
            />
          </span>
        ),
        props: getNameCellProps(displayName),
      },
      [tableColumnInfo[1].id]: {
        cell: obj.spec.group,
      },
      [tableColumnInfo[2].id]: {
        cell: getLatestVersionForCRD(obj),
      },
      [tableColumnInfo[3].id]: {
        cell: <IsNamespaced obj={obj} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <Established crd={obj} />,
      },
      [tableColumnInfo[5].id]: {
        cell: (
          <LazyActionMenu context={{ [referenceForModel(CustomResourceDefinitionModel)]: obj }} />
        ),
        props: actionsCellProps,
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

export const CustomResourceDefinitionsList: React.FCC<CustomResourceDefinitionsListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const columns = useCustomResourceDefinitionsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<CustomResourceDefinitionKind>
        {...props}
        label={CustomResourceDefinitionModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const CustomResourceDefinitionsPage: React.FC = (props) => (
  <ListPage
    {...props}
    ListComponent={CustomResourceDefinitionsList}
    kind={kind}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const CustomResourceDefinitionsDetailsPage: React.FC = (props) => {
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(CustomResourceDefinitionModel)}
      customActionMenu={(k8sObj: K8sModel, obj: CustomResourceDefinitionKind) => (
        <LazyActionMenu
          context={{ [referenceForModel(CustomResourceDefinitionModel)]: obj }}
          variant={ActionMenuVariant.DROPDOWN}
        />
      )}
      pages={[
        navFactory.details(Details),
        navFactory.editYaml(),
        {
          // t('public~Instances')
          nameKey: 'public~Instances',
          href: 'instances',
          component: Instances,
        },
      ]}
    />
  );
};

export type CustomResourceDefinitionsListProps = {
  data: CustomResourceDefinitionKind[];
  loaded: boolean;
};

type InstancesProps = {
  obj: CustomResourceDefinitionKind;
  namespace: string;
};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';

export type CRDVersionProps = {
  versions: CRDVersion[];
};
