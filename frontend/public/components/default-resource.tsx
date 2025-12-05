import * as _ from 'lodash';
import * as React from 'react';
import { JSONPath } from 'jsonpath-plus';
import { useTranslation } from 'react-i18next';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { PageComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/horizontal-nav-tabs';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { useDetailsItemExtensionsForResource } from '@console/shared/src/hooks/useDetailsItemExtensionsForResource';
import { ExtensionDetailsItem } from '@console/shared/src/components/details-page/ExtensionDetailsItem';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Conditions } from './conditions';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import type { TableProps } from './factory/table';
import {
  referenceFor,
  K8sResourceKind,
  CRDAdditionalPrinterColumn,
  referenceForExtensionModel,
  ExtensionK8sGroupModel,
} from '../module/k8s';
import { DetailsItem } from './utils/details-item';
import { kindObj } from './utils/inject';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { LoadingBox } from './utils/status-box';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useCRDAdditionalPrinterColumns } from '@console/shared/src/hooks/useCRDAdditionalPrinterColumns';
import { AdditionalPrinterColumnValue } from '@console/shared/src/components/additional-printer-column/AdditionalPrinterColumnValue';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
} from '@console/app/src/components/data-view/types';
import { DASH } from '@console/shared/src/constants/ui';
import {
  isResourceActionProvider,
  ResourceActionProvider,
  useResolvedExtensions,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace' }, { id: 'created' }, { id: 'actions' }];

const getPathArray = (path: string) => {
  return JSONPath.toPathArray(path);
};

const checkPathHasSpecialCharacter = (path: string) => {
  const pathArray = getPathArray(path);
  return pathArray.some((segment) => /[^a-zA-Z0-9]/.test(segment));
};

const checkColumnsForCreationTimestamp = (columns: CRDAdditionalPrinterColumn[]) => {
  return columns.some((col) => col.jsonPath === '.metadata.creationTimestamp');
};

const checkAdditionalPrinterColumns = (columns: CRDAdditionalPrinterColumn[]) => {
  return columns.length > 0;
};

const getAdditionaPrinterColumnID = (column: CRDAdditionalPrinterColumn) => {
  return `apc-${column.name}`;
};

type ResourceActionsMenuProps = {
  resource: K8sResourceKind;
} & Pick<React.ComponentProps<typeof ActionMenu>, 'variant' | 'appendTo'>;

const ResourceActionsMenu: React.FC<ResourceActionsMenuProps> = ({
  resource,
  variant,
  appendTo,
}) => {
  const common = useCommonResourceActions(kindObj(referenceFor(resource)), resource);
  const menuActions = [...common];
  return <ActionMenu actions={menuActions} variant={variant} appendTo={appendTo} />;
};

const NamespaceCell: React.FCC<NamespaceCellProps> = ({ namespace }) => {
  const { t } = useTranslation();
  return namespace ? <ResourceLink kind="Namespace" name={namespace} /> : <>{t('public~None')}</>;
};

export const DetailsForKind: React.FC<PageComponentProps<K8sResourceKind>> = ({ obj }) => {
  const { t } = useTranslation();
  const groupVersionKind = getGroupVersionKindForResource(obj);
  const [model] = useK8sModel(groupVersionKind);
  const leftDetailsItemExtensions = useDetailsItemExtensionsForResource(obj, 'left');
  const rightDetailsItemExtensions = useDetailsItemExtensionsForResource(obj, 'right');
  const leftDetailsItems = React.useMemo(
    () =>
      leftDetailsItemExtensions.map((extension) => (
        <ExtensionDetailsItem key={extension.properties.id} extension={extension} obj={obj} />
      )),
    [leftDetailsItemExtensions, obj],
  );

  const rightDetailsItems = React.useMemo(
    () =>
      rightDetailsItemExtensions.map((extension) => (
        <ExtensionDetailsItem key={extension.properties.id} extension={extension} obj={obj} />
      )),
    [rightDetailsItemExtensions, obj],
  );
  const hasRightDetailsItems = rightDetailsItems.length > 0;

  const [additionalPrinterColumns] = useCRDAdditionalPrinterColumns(model);
  const hasAdditionalPrinterColumns = checkAdditionalPrinterColumns(additionalPrinterColumns);

  return (
    <>
      <PaneBody>
        <SectionHeading
          text={t('public~{{kind}} details', {
            kind: model?.labelKey ? t(model.labelKey) : model?.label,
          })}
        />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false}>
              {leftDetailsItems}
            </ResourceSummary>
          </GridItem>
          {(hasAdditionalPrinterColumns || hasRightDetailsItems) && (
            <GridItem md={6}>
              <DescriptionList
                data-test={hasAdditionalPrinterColumns ? 'additional-printer-columns' : undefined}
              >
                <>
                  {hasAdditionalPrinterColumns && (
                    <>
                      {additionalPrinterColumns.map((col) => {
                        const path = col.jsonPath.replace(/^\./, '');
                        const pathArray = getPathArray(path);
                        const pathHasSpecialCharacter = checkPathHasSpecialCharacter(path);

                        return (
                          <DetailsItem
                            key={col.name}
                            obj={obj}
                            label={col.name}
                            path={!pathHasSpecialCharacter && pathArray}
                          >
                            <AdditionalPrinterColumnValue col={col} obj={obj} />
                          </DetailsItem>
                        );
                      })}
                    </>
                  )}
                  {hasRightDetailsItems && rightDetailsItems}
                </>
              </DescriptionList>
            </GridItem>
          )}
        </Grid>
      </PaneBody>
      {_.isArray(obj?.status?.conditions) && (
        <PaneBody>
          <SectionHeading text={t('public~Conditions')} />
          <Conditions conditions={obj.status.conditions} />
        </PaneBody>
      )}
    </>
  );
};

const getDataViewRows = (
  data: RowProps<K8sResourceKind>[],
  columns: ConsoleDataViewColumn<K8sResourceKind>[],
  additionalPrinterColumns: CRDAdditionalPrinterColumn[],
  kinds: string[],
  resourceProviderExtensions: ResolvedExtension<ResourceActionProvider>[],
  resourceProviderExtensionsResolved: boolean,
): ConsoleDataViewRow[] => {
  return data.map(({ obj }) => {
    const { name, namespace, creationTimestamp } = obj.metadata;
    const kind = referenceFor(obj) || kinds[0];

    const hasExtensionActions =
      resourceProviderExtensionsResolved && resourceProviderExtensions?.length > 0;

    const additionalPrinterColumnsCells = additionalPrinterColumns.reduce((acc, col) => {
      acc[getAdditionaPrinterColumnID(col)] = {
        cell: <AdditionalPrinterColumnValue key={col.name} col={col} obj={obj} />,
        props: {
          'data-test': `additional-printer-column-data-${col.name}`,
        },
      };
      return acc;
    }, {} as Record<string, { cell: React.ReactNode; props?: any }>);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <NamespaceCell namespace={namespace} />,
      },
      ...additionalPrinterColumnsCells,
      ...(!checkColumnsForCreationTimestamp(additionalPrinterColumns) && {
        [tableColumnInfo[2].id]: {
          cell: <Timestamp timestamp={creationTimestamp} />,
          props: {
            'data-test': 'column-data-Created',
          },
        },
      }),
      [tableColumnInfo[3].id]: {
        cell: (
          <>
            {hasExtensionActions ? (
              <LazyActionMenu context={{ [kind]: obj }} />
            ) : (
              <ResourceActionsMenu
                resource={obj}
                variant={ActionMenuVariant.KEBAB}
                appendTo={document.getElementById('popper-container') ?? document.body}
              />
            )}
          </>
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const useDefaultResourceColumns = <T extends K8sResourceKind>(
  additionalPrinterColumns: CRDAdditionalPrinterColumn[],
): TableColumn<T>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    const additionalPrinterColumnsHeaders = additionalPrinterColumns.map((col) => {
      const path = col.jsonPath;
      const pathHasSpecialCharacter = checkPathHasSpecialCharacter(path);

      return {
        title: col.name,
        id: getAdditionaPrinterColumnID(col),
        sort: pathHasSpecialCharacter ? undefined : path.replace(/^\./, ''),
        props: {
          modifier: 'nowrap',
          'data-test': `additional-printer-column-header-${col.name}`,
        },
      };
    });

    const baseColumns = [
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
      ...additionalPrinterColumnsHeaders,
    ];

    if (!checkColumnsForCreationTimestamp(additionalPrinterColumns)) {
      baseColumns.push({
        title: t('public~Created'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
          'data-test': 'column-header-Created',
        },
      });
    }

    baseColumns.push({
      title: '',
      id: tableColumnInfo[3].id,
      sort: '',
      props: {
        ...cellIsStickyProps,
        modifier: 'nowrap',
      },
    });

    return baseColumns;
  }, [t, additionalPrinterColumns]);

  return columns;
};

export const DefaultList: React.FC<TableProps & { kinds: string[] }> = (props) => {
  const { t } = useTranslation();
  const { kinds, data, loaded } = props;
  const [model] = useK8sModel(kinds[0]);
  const [additionalPrinterColumns, additionalPrinterColumnsLoaded] = useCRDAdditionalPrinterColumns(
    model,
  );
  const columns = useDefaultResourceColumns(
    additionalPrinterColumnsLoaded ? additionalPrinterColumns : [],
  );
  const resourceProviderGuard = React.useCallback(
    (e): e is ResourceActionProvider =>
      isResourceActionProvider(e) &&
      referenceForExtensionModel(e.properties.model as ExtensionK8sGroupModel) === kinds[0],
    [kinds],
  );
  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceProviderGuard);

  const getAriaLabel = () => {
    // API discovery happens asynchronously. Avoid runtime errors if the model hasn't loaded.
    if (!model) {
      return '';
    }
    return model.labelPluralKey ? t(model.labelPluralKey) : model.labelPlural;
  };

  return (
    <>
      {!loaded && !additionalPrinterColumnsLoaded ? (
        <LoadingBox blame="DefaultList" />
      ) : (
        <ConsoleDataView<K8sResourceKind>
          {...props}
          label={getAriaLabel()}
          data={data}
          loaded={loaded}
          columns={columns}
          getDataViewRows={(dvData, dvColumns) =>
            getDataViewRows(
              dvData,
              dvColumns,
              additionalPrinterColumns,
              kinds,
              resourceProviderExtensions,
              resourceProviderExtensionsResolved,
            )
          }
          hideColumnManagement={true}
        />
      )}
    </>
  );
};
DefaultList.displayName = 'DefaultList';

export const DefaultPage: React.FC<Omit<React.ComponentProps<typeof ListPage>, 'ListComponent'>> = (
  props,
) => (
  <ListPage
    {...props}
    ListComponent={DefaultList}
    canCreate={props.canCreate ?? _.get(kindObj(props.kind), 'crd')}
    omitFilterToolbar={true}
  />
);
DefaultPage.displayName = 'DefaultPage';

export const DefaultDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const resourceProviderGuard = React.useCallback(
    (e): e is ResourceActionProvider =>
      isResourceActionProvider(e) &&
      referenceForExtensionModel(e.properties.model as ExtensionK8sGroupModel) === props.kind,
    [props.kind],
  );
  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceProviderGuard);
  const hasExtensionActions =
    resourceProviderExtensionsResolved && resourceProviderExtensions?.length > 0;
  return (
    <DetailsPage
      {...props}
      customActionMenu={(k8sObj, obj) =>
        hasExtensionActions ? (
          <LazyActionMenu
            context={{ [referenceFor(obj)]: obj }}
            variant={ActionMenuVariant.DROPDOWN}
          />
        ) : (
          <ResourceActionsMenu resource={obj} variant={ActionMenuVariant.DROPDOWN} />
        )
      }
      pages={pages}
    />
  );
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';

type NamespaceCellProps = {
  namespace: string;
};
