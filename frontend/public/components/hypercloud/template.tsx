import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { TemplateModel } from '../../models';
import { TemplateKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const templateReference: K8sResourceKindReference = 'Template';
const { common } = Kebab.factory;

export const templateMenuActions = [...Kebab.getExtensionsActionsForKind(TemplateModel), ...common];

const TemplateDetails: React.FC<TemplateDetailsProps> = ({ obj: template }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Template Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={template} showPodSelector></ResourceSummary>
          </div>
        </div>
      </div>
    </>
  );
};

type TemplateDetailsProps = {
  obj: TemplateKind;
};

const { details, editYaml } = navFactory;
const TemplatesDetailsPage: React.FC<TemplatesDetailsPageProps> = props => <DetailsPage {...props} kind={templateReference} menuActions={templateMenuActions} pages={[details(TemplateDetails), editYaml()]} />;
TemplatesDetailsPage.displayName = 'TemplatesDetailsPage';

const kind = 'Template';
const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // OBJECTS
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
  Kebab.columnClass,
]; // MENU ACTIONS

const TemplateTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={templateReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{(obj.objects && obj.objects.length) || 'None'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={templateMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const TemplateTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Objects',
      sortField: 'objects.length',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};

TemplateTableHeader.displayName = 'TemplateTableHeader';

const TemplatesList: React.FC = props => <Table {...props} aria-label="Template" Header={TemplateTableHeader} Row={TemplateTableRow} />;
TemplatesList.displayName = 'TemplatesList';

const TemplatesPage: React.FC<TemplatesPageProps> = props => {
  return <ListPage canCreate={true} kind={templateReference} ListComponent={TemplatesList} {...props} />;
};
TemplatesPage.displayName = 'TemplatesPage';

export { TemplatesList, TemplatesPage, TemplatesDetailsPage };

type TemplatesPageProps = {};

type TemplatesDetailsPageProps = {
  match: any;
};
