import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';

import { Conditions } from './conditions';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
  TableProps,
  RowFunction,
} from './factory';
import {
  referenceFor,
  kindForReference,
  K8sResourceKind,
  modelFor,
  K8sResourceKindReference,
} from '../module/k8s';
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

export const DetailsForKind = (
  kind: string,
  additionalDetailsCallback?: (obj: K8sResourceKind) => React.ReactNode,
) =>
  function DetailsForKind_({ obj }) {
    const { t } = useTranslation();

    const getKindLabel = (item: K8sResourceKindReference) => {
      const model = modelFor(item);
      return model?.labelKey ? t(model.labelKey) : kindForReference(item);
    };

    const additionalDetails: React.ReactNode =
      additionalDetailsCallback && additionalDetailsCallback(obj);

    return (
      <>
        <div className="co-m-pane__body">
          <SectionHeading
            text={t('public~{{kindLabel}} details', { kindLabel: getKindLabel(kind) })}
          />
          <div className="row">
            <div className="col-md-6">
              <ResourceSummary
                resource={obj}
                podSelector="spec.podSelector"
                showNodeSelector={false}
              />
            </div>
            {additionalDetails && <div className="col-md-6">{additionalDetails}</div>}
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

export const DefaultList: React.FC<TableProps> = (props) => {
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

  const TableRowForKind: RowFunction<K8sResourceKind> = ({
    obj,
    index,
    key,
    style,
    customData,
  }) => {
    const kind = referenceFor(obj) || customData.kind;
    const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(kind)), ...common];

    return (
      <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
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
      </TableRow>
    );
  };

  const getAriaLabel = (item) => {
    const model = modelFor(item);
    // API discovery happens asynchronously. Avoid runtime errors if the model hasn't loaded.
    if (!model) {
      return '';
    }
    return model.labelPluralKey ? t(model.labelPluralKey) : model.labelPlural;
  };

  return (
    <Table
      {...props}
      aria-label={getAriaLabel(kinds[0])}
      kinds={[kinds[0]]}
      customData={{ kind: kinds[0] }}
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
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(props.kind)), ...common];

  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';
