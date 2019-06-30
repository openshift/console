import * as React from 'react';

import { CreateYAML } from '@console/internal/components/create-yaml';
import { TemplateModel } from '@console/internal/models';
import { VMTemplateYAMLTemplates } from '../../models/templates';

export const CreateVMTemplateYAML = (props: any) => (
  <CreateYAML
    {...props as any}
    plural={TemplateModel.plural}
    template={VMTemplateYAMLTemplates.getIn(['vm-template'])}
  />
);
