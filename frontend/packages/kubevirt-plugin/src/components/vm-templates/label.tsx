import * as React from 'react';
import { TemplateKind } from '@console/internal/module/k8s';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import {
  getTemplateSupport,
  getTemplateProvider,
  getTemplateParentProvider,
  isCommonTemplate,
} from '../../selectors/vm-template/basic';

import './label.scss';

type VMTemplateLabelProps = {
  template: TemplateKind;
  className?: string;
};

export const VMTemplateLabel: React.FC<VMTemplateLabelProps> = ({ template, className }) => {
  const { t } = useTranslation();
  const templateSupport = getTemplateSupport(template);
  const provider = getTemplateProvider(t, template);
  const parentProvider = getTemplateParentProvider(template);

  const hasParentProvider = templateSupport.parent && parentProvider;
  return (
    <div className={className}>
      {templateSupport.parent === 'Full' && parentProvider && (
        <Tooltip
          content={t('kubevirt-plugin~{{provider}} supported', { provider: parentProvider })}
        >
          <Label color="green">{parentProvider}</Label>
        </Tooltip>
      )}
      {templateSupport.provider === 'Full' && provider && (
        <Tooltip content={t('kubevirt-plugin~{{provider}} supported', { provider })}>
          <Label
            color={isCommonTemplate(template) ? 'green' : 'blue'}
            className={hasParentProvider ? 'kv-template-support__label' : undefined}
          >
            {provider}
          </Label>
        </Tooltip>
      )}
    </div>
  );
};
