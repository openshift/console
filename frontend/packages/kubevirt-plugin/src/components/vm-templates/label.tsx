import * as React from 'react';
import { TemplateKind } from '@console/internal/module/k8s';
import { Label } from '@patternfly/react-core';

import { isTemplateSupported } from '../../selectors/vm-template/basic';

type VMTemplateLabelProps = {
  template: TemplateKind;
};

export const VMTemplateLabel: React.FC<VMTemplateLabelProps> = ({ template }) =>
  isTemplateSupported(template) && <Label color="green">Red Hat supported</Label>;
