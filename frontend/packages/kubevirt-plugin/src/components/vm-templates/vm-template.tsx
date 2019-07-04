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
import { getNamespace, DASH } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';
import { match } from 'react-router';
import { dimensifyHeader, dimensifyRow } from '../../utils/table';
import { VMTemplateLink } from './vm-template-link';

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

const VMTemplateTableHeader = () =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Description',
        sortField: 'metadata.annotations.description',
        transforms: [sortable],
      },
      {
        title: 'Source',
      },
      {
        title: 'OS',
      },
      {
        title: 'Flavor',
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

VMTemplateTableHeader.displayName = 'VMTemplateTableHeader';

const VMTemplateTableRow: React.FC<VMTemplateTableRowProps> = ({
  obj: template,
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);
  const os = getTemplateOperatingSystems([template])[0];

  return (
    <TableRow id={template.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <VMTemplateLink template={template} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind="Namespace"
          name={getNamespace(template)}
          title={getNamespace(template)}
        />
      </TableData>
      <TableData className={dimensify()}>
        {_.get(template.metadata, 'annotations.description', DASH)}
      </TableData>
      <TableData className={dimensify()}>
        <TemplateSource template={template} />
      </TableData>
      <TableData className={dimensify()}>{os ? os.name || os.id : DASH}</TableData>
      <TableData className={dimensify()}>{getTemplateFlavors([template])[0]}</TableData>
      <TableData className={dimensify(true)}>
        <ResourceKebab actions={menuActions} kind={kind} resource={template} />
      </TableData>
    </TableRow>
  );
};
VMTemplateTableRow.displayName = 'VmTemplateTableRow';

const VirtualMachineTemplates: React.FC<React.ComponentProps<typeof Table>> = (props) => {
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

const VirtualMachineTemplatesPage: React.FC<
  VirtualMachineTemplatesPageProps & React.ComponentProps<typeof ListPage>
> = (props) => (
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

export { VirtualMachineTemplatesPage };
