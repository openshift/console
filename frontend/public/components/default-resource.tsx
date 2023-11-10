import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import { PageComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/horizontal-nav-tabs';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { useDetailsItemExtensionsForResource } from '@console/shared/src/hooks/useDetailsItemExtensionsForResource';
import { ExtensionDetailsItem } from '@console/shared/src/components/details-page/ExtensionDetailsItem';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableData, TableProps, RowFunctionArgs } from './factory';
import { referenceFor, K8sResourceKind, modelFor } from '../module/k8s';
import {
  Kebab,
  kindObj,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';

const { common } = Kebab.factory;

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

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

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('public~{{kind}} details', {
            kind: model?.labelKey ? t(model.labelKey) : model?.label,
          })}
        />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false}>
              {leftDetailsItems}
            </ResourceSummary>
          </div>
          {rightDetailsItems.length > 0 && (
            <dl className="co-m-pane__details col-md-6">{rightDetailsItems}</dl>
          )}
        </div>
      </div>
      {_.isArray(obj?.status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Conditions')} />
          <Conditions conditions={obj.status.conditions} />
        </div>
      )}
    </>
  );
};

const TableRowForKind: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj, customData }) => {
  const kind = referenceFor(obj) || customData.kind;
  const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(kind)), ...common];
  const { t } = useTranslation();
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={customData.kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('public~None')
        )}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </>
  );
};

export const DefaultList: React.FC<TableProps & { kinds: string[] }> = (props) => {
  const { t } = useTranslation();

  const { kinds } = props;

  const TableHeader = () => {
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
        title: t('public~Created'),
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

  const getAriaLabel = (item) => {
    const model = modelFor(item);
    // API discovery happens asynchronously. Avoid runtime errors if the model hasn't loaded.
    if (!model) {
      return '';
    }
    return model.labelPluralKey ? t(model.labelPluralKey) : model.labelPlural;
  };

  const customData = React.useMemo(
    () => ({
      kind: kinds[0],
    }),
    [kinds],
  );

  return (
    <Table
      {...props}
      aria-label={getAriaLabel(kinds[0])}
      customData={customData}
      Header={TableHeader}
      Row={TableRowForKind}
      virtualize
    />
  );
};
DefaultList.displayName = 'DefaultList';

export const DefaultPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    ListComponent={DefaultList}
    canCreate={props.canCreate ?? _.get(kindObj(props.kind), 'crd')}
  />
);
DefaultPage.displayName = 'DefaultPage';

export const DefaultDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(props.kind)), ...common];

  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';
