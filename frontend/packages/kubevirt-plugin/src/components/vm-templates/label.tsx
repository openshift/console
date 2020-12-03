import * as React from 'react';
import { TemplateKind } from '@console/internal/module/k8s';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import {
  getTemplateSupport,
  getTemplateProvider,
  isCommonTemplate,
} from '../../selectors/vm-template/basic';

type VMTemplateLabelProps = {
  template: TemplateKind;
};

export const VMTemplateLabel: React.FC<VMTemplateLabelProps> = ({ template }) => {
  const { t } = useTranslation();
  const supportLevel = getTemplateSupport(template);
  const provider = getTemplateProvider(t, template);
  return (
    !!supportLevel && (
      <Label color={isCommonTemplate(template) ? 'green' : 'blue'}>
        {t('kubevirt-plugin~{{provider}} supported', { provider })}
      </Label>
    )
  );
};
