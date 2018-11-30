import React from 'react';
import * as _ from 'lodash';
import { VmTemplateModel } from '../models';
import { ListPage, List, ResourceRow, ListHeader, ColHead } from './factory/okdfactory';
import { ResourceLink, ResourceKebab, Kebab } from './utils/okdutils';
import { DASHES } from './utils/constants';

const menuActions = [Kebab.factory.Delete];
const nameRowStyle = 'col-lg-2 col-md-2 col-sm-2 col-xs-6';
const descriptionRowStyle = 'col-lg-10 col-md-10 col-sm-10 col-xs-6';

const VmTemplateHeader = props => <ListHeader>
  <ColHead {...props} className={nameRowStyle} sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className={descriptionRowStyle} sortField="metadata.annotations.description">Description</ColHead>
</ListHeader>;

const VmTemplateRow = ({obj: template}) => <ResourceRow obj={template}>
  <div className={nameRowStyle}>
    <ResourceLink kind={VmTemplateModel.kind} name={template.metadata.name} namespace={template.metadata.namespace} title={template.metadata.uid} />
  </div>
  <div className={descriptionRowStyle}>
    {_.get(template.metadata, 'annotations.description', DASHES)}
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={VmTemplateModel.kind} resource={template} />
  </div>
</ResourceRow>;


const VmTemplateList = props => <List {...props} Header={VmTemplateHeader} Row={VmTemplateRow} />;

export const VmTemplatesPageTitle = 'Virtual Machine Templates';

export const VirtualMachineTemplatesPage = props => <ListPage
  {...props}
  title={VmTemplatesPageTitle}
  selector={VmTemplateModel.selector}
  kind={VmTemplateModel.kind}
  ListComponent={VmTemplateList}
/>;
