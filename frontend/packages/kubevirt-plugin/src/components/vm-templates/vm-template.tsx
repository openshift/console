import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import {
  TemplateSource,
  getTemplateOperatingSystems,
  getTemplateFlavors,
  TEMPLATE_TYPE_LABEL,
} from 'kubevirt-web-ui-components';

import { ListPage, Table, TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, ResourceKebab } from '@console/internal/components/utils';
import { getName, getNamespace, DASH, getUid } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '../../../../../public/module/k8s/index';

export const menuActions = Kebab.factory.common;

const { kind } = TemplateModel;
const selector = {
  matchLabels: { [TEMPLATE_TYPE_LABEL]: 'vm' },
};
const labelPlural = 'Virtual Machine Templates';

const tableColumnClass = classNames('col-lg-2', 'col-sm-4', 'col-xs-4');
const tableColumnClassHiddenOnSmall = classNames('col-lg-2', 'hidden-sm', 'hidden-xs');

const tableColumnClasses = [
  tableColumnClass,
  tableColumnClass,
  tableColumnClass,
  tableColumnClassHiddenOnSmall,
  tableColumnClassHiddenOnSmall,
  tableColumnClassHiddenOnSmall,
  Kebab.columnClass,
];

const VmTemplateTableHeader = () => {
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
      title: 'Description',
      sortField: 'metadata.annotations.description',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Source',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'OS',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Flavor',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
VmTemplateTableHeader.displayName = 'VmTemplateTableHeader';

const VmTemplateTableRow = ({ obj: template, index, key, style }: VmTemplateTableRowProps) => {
  const os = getTemplateOperatingSystems([template])[0];

  return (
    <TableRow id={template.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={getName(template)}
          namespace={getNamespace(template)}
          title={getUid(template)}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink
          kind="Namespace"
          name={getNamespace(template)}
          title={getNamespace(template)}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(template.metadata, 'annotations.description', DASH)}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <TemplateSource template={template} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{os ? os.name || os.id : DASH}</TableData>
      <TableData className={tableColumnClasses[5]}>{getTemplateFlavors([template])[0]}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={template} />
      </TableData>
    </TableRow>
  );
};
VmTemplateTableRow.displayName = 'VmTemplateTableRow';

const VirtualMachineTemplates = (props: React.ComponentProps<typeof Table>) => {
  return (
    <Table
      {...props}
      aria-label={labelPlural}
      Header={VmTemplateTableHeader}
      Row={VmTemplateTableRow}
    />
  );
};

const VirtualMachineTemplatesPage = (props: React.ComponentProps<typeof ListPage>) => (
  <ListPage
    {...props}
    title={labelPlural}
    ListComponent={VirtualMachineTemplates}
    kind={kind}
    selector={selector}
    canCreate
  />
);

type VmTemplateTableRowProps = {
  obj: TemplateKind;
  index: number;
  key: string;
  style: any;
};

export { VirtualMachineTemplates, VirtualMachineTemplatesPage };
