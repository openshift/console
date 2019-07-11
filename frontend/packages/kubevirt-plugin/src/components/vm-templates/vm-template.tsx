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
  asAccessReview,
} from '@console/internal/components/utils';
import { getNamespace, DASH, getName } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';
import { match } from 'react-router';
import { dimensifyHeader, dimensifyRow } from '../../utils/table';
import { VMTemplateLink } from './vm-template-link';
import { VM_TEMPLATE_LABEL_PLURAL } from '../../constants/vm-templates';

const vmTemplateEditAction = (kind, obj) => ({
  label: `Edit VM Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});
const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  vmTemplateEditAction,
  Kebab.factory.Delete,
];

const { kind } = TemplateModel;
const selector = {
  matchLabels: { [TEMPLATE_TYPE_LABEL]: 'vm' },
};

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
      aria-label={VM_TEMPLATE_LABEL_PLURAL}
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
    title={VM_TEMPLATE_LABEL_PLURAL}
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
