import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { TemplateModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const { common } = Kebab.factory;
const kind = TemplateModel.kind;

export const templateMenuActions = [...Kebab.getExtensionsActionsForKind(TemplateModel), ...common];

const objectKinds = template => {
  const objects = !!template.objectKinds ? template.objectKinds : [];
  let objMap = new Map();
  for (const i in objects) {
    const kind = !!objects[i] ? objects[i] : 'unknown kind';
    if (!!objMap.get(kind)) {
      const num = objMap.get(kind) as number;
      objMap.set(kind, num + 1);
    } else {
      objMap.set(kind, 1);
    }
  }
  const objectList = [];
  objMap.forEach((value, key) => {
    objectList.push(
      <div>
        {key} {value}
      </div>,
    );
  });

  return <div>{objectList}</div>;
};

const TemplateDetails: React.FC<TemplateDetailsProps> = ({ obj: template }) => {
  const { t } = useTranslation();
  const objectSummary = objectKinds(template);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_20')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={template} showPodSelector showOwner={false}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104')}</dt>
              <dd>{objectSummary}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type TemplateDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const TemplatesDetailsPage: React.FC<TemplatesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={templateMenuActions} pages={[details(TemplateDetails), editYaml()]} />;
TemplatesDetailsPage.displayName = 'TemplatesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // RESOURCE SUMMARY
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const TemplateTableRow = ({ obj, index, key, style }) => {
  const objectSummary = objectKinds(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{objectSummary}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={templateMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const TemplateTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104'),
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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

const TemplatesList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Template" Header={TemplateTableHeader.bind(null, t)} Row={TemplateTableRow} />;
};
TemplatesList.displayName = 'TemplatesList';

const TemplatesPage: React.FC<TemplatesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_20')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_20') })} canCreate={true} kind={kind} ListComponent={TemplatesList} {...props} />;
};
TemplatesPage.displayName = 'TemplatesPage';

export { TemplatesList, TemplatesPage, TemplatesDetailsPage };

type TemplatesPageProps = {};

type TemplatesDetailsPageProps = {
  match: any;
};
