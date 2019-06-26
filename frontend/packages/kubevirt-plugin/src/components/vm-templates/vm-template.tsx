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
import {
  Kebab,
  ResourceLink,
  ResourceKebab,
  ResourceIcon,
} from '@console/internal/components/utils';
import { getName, getNamespace, DASH, getUid } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { Link } from 'react-router-dom';
import { TemplateKind } from '@console/internal/module/k8s';
import { match } from 'react-router';

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

const VMTemplateTableHeader = () => {
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
VMTemplateTableHeader.displayName = 'VMTemplateTableHeader';

const VMTemplateTableRow = ({ obj: template, index, key, style }: VMTemplateTableRowProps) => {
  const os = getTemplateOperatingSystems([template])[0];
  const name = getName(template);
  const namespace = getNamespace(template);

  return (
    <TableRow id={template.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceIcon kind={kind} />
        <Link
          to={`/k8s/ns/${namespace}/vmtemplates/${name}`}
          title={getUid(template)}
          className="co-resource-item__resource-name"
        >
          {name}
        </Link>
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
VMTemplateTableRow.displayName = 'VmTemplateTableRow';

const VirtualMachineTemplates = (props: React.ComponentProps<typeof Table>) => {
  return (
    <Table
      {...props}
      aria-label={labelPlural}
      Header={VMTemplateTableHeader}
      Row={VMTemplateTableRow}
    />
  );
};

const getCreateProps = (namespace: string) => ({
  items: {
    yaml: 'Create from YAML',
  },
  createLink: () => `/k8s/ns/${namespace || 'default'}/vmtemplates/~new/`,
});

const VirtualMachineTemplatesPage = (
  props: VirtualMachineTemplatesPageProps & React.ComponentProps<typeof ListPage>,
) => (
  <ListPage
    {...props}
    title={labelPlural}
    ListComponent={VirtualMachineTemplates}
    kind={kind}
    selector={selector}
    canCreate
    createProps={getCreateProps(props.match.params.ns)}
  />
);

type VMTemplateTableRowProps = {
  obj: TemplateKind;
  index: number;
  key: string;
  style: any;
};

type VirtualMachineTemplatesPageProps = {
  match: match<{ ns?: string }>;
};

export { VirtualMachineTemplates, VirtualMachineTemplatesPage };
