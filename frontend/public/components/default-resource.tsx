import * as _ from 'lodash';
import * as React from 'react';
import { JSONPath } from 'jsonpath-plus';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { PageComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/horizontal-nav-tabs';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { useDetailsItemExtensionsForResource } from '@console/shared/src/hooks/useDetailsItemExtensionsForResource';
import { ExtensionDetailsItem } from '@console/shared/src/components/details-page/ExtensionDetailsItem';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableData, TableProps, RowFunctionArgs } from './factory';
import {
  referenceFor,
  K8sResourceKind,
  referenceForExtensionModel,
  ExtensionK8sGroupModel,
  CRDAdditionalPrinterColumn,
} from '../module/k8s';
import {
  DetailsItem,
  Kebab,
  kindObj,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import {
  isResourceActionProvider,
  ResourceActionProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { useCRDAdditionalPrinterColumns } from '@console/shared/src/hooks/useCRDAdditionalPrinterColumns';
import { AdditionalPrinterColumnValue } from '@console/shared/src/components/additional-printer-column/AdditionalPrinterColumnValue';

const { common } = Kebab.factory;

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const getPathArray = (path: string) => {
  return JSONPath.toPathArray(path);
};

const checkPathHasSpecialCharacter = (path: string) => {
  const pathArray = getPathArray(path);
  return pathArray.some((segment) => /[^a-zA-Z0-9]/.test(segment));
};

const getMaxAdditionalPrinterColumns = (columns: CRDAdditionalPrinterColumn[]) => {
  return columns.slice(0, 3);
};

const checkColumnsForCreationTimestamp = (columns: CRDAdditionalPrinterColumn[]) => {
  return columns.some((col) => col.jsonPath === '.metadata.creationTimestamp');
};

const checkAdditionalPrinterColumns = (columns: CRDAdditionalPrinterColumn[]) => {
  return columns.length > 0;
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

  const additionalPrinterColumns = useCRDAdditionalPrinterColumns(model);
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

const TableRowForKind: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj, customData }) => {
  const kind = referenceFor(obj) || customData.kind;

  const menuActions = [...common];
  const { t } = useTranslation();

  const resourceProviderGuard = React.useCallback(
    (e): e is ResourceActionProvider =>
      isResourceActionProvider(e) &&
      referenceForExtensionModel(e.properties.model as ExtensionK8sGroupModel) === kind,
    [kind],
  );

  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceProviderGuard);

  const hasExtensionActions =
    resourceProviderExtensionsResolved && resourceProviderExtensions?.length > 0;

  const additionalPrinterColumns = customData.additionalPrinterColumns;

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={customData.kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')}>
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('public~None')
        )}
      </TableData>
      {additionalPrinterColumns.map((col) => {
        return (
          <TableData
            key={col.name}
            className={tableColumnClasses[2]}
            dataTest={`additional-printer-column-data-${col.name}`}
          >
            <AdditionalPrinterColumnValue col={col} obj={obj} />
          </TableData>
        );
      })}
      {!checkColumnsForCreationTimestamp(additionalPrinterColumns) && (
        <TableData className={tableColumnClasses[2]} dataTest="column-data-Created">
          <Timestamp timestamp={obj.metadata.creationTimestamp} />
        </TableData>
      )}
      <TableData className={tableColumnClasses[3]}>
        {hasExtensionActions ? (
          <LazyActionMenu context={{ [kind]: obj }} />
        ) : (
          <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
        )}
      </TableData>
    </>
  );
};

export const DefaultList: React.FC<TableProps & { kinds: string[] }> = (props) => {
  const { t } = useTranslation();

  const { kinds } = props;
  const [model] = useK8sModel(kinds[0]);
  const additionalPrinterColumns = getMaxAdditionalPrinterColumns(
    useCRDAdditionalPrinterColumns(model),
  );

  const TableHeader = () => {
    const additionalPrinterColumnsHeaders = additionalPrinterColumns.map((col) => {
      const path = col.jsonPath;
      const pathHasSpecialCharacter = checkPathHasSpecialCharacter(path);

      return {
        title: col.name,
        sortField: pathHasSpecialCharacter ? undefined : path.replace(/^\./, ''),
        transforms: pathHasSpecialCharacter ? undefined : [sortable],
        props: {
          className: tableColumnClasses[2],
          'data-test': `additional-printer-column-header-${col.name}`,
        },
      };
    });

    const headers = [
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
      ...additionalPrinterColumnsHeaders,
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];

    if (!checkColumnsForCreationTimestamp(additionalPrinterColumns)) {
      headers.splice(headers.length - 1, 0, {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[2], 'data-test': 'column-header-Created' },
      });
    }

    return headers;
  };

  const getAriaLabel = () => {
    // API discovery happens asynchronously. Avoid runtime errors if the model hasn't loaded.
    if (!model) {
      return '';
    }
    return model.labelPluralKey ? t(model.labelPluralKey) : model.labelPlural;
  };

  const customData = React.useMemo(
    () => ({
      additionalPrinterColumns,
      kind: kinds[0],
    }),
    [additionalPrinterColumns, kinds],
  );

  const hasAdditionalPrinterColumns = checkAdditionalPrinterColumns(additionalPrinterColumns);

  return (
    <Table
      {...props}
      aria-label={getAriaLabel()}
      customData={customData}
      Header={TableHeader}
      Row={TableRowForKind}
      virtualize
      data-test={hasAdditionalPrinterColumns ? 'has-additional-printer-columns' : undefined}
    />
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
  />
);
DefaultPage.displayName = 'DefaultPage';

export const DefaultDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const menuActions = [...common];

  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';
