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

type VMTemplateLabelProps = {
  template: TemplateKind;
  className?: string;
};

export const VMTemplateLabel: React.FC<VMTemplateLabelProps> = ({ template, className }) => {
  const { t } = useTranslation();
  const templateSupport = getTemplateSupport(template);
  const provider = getTemplateProvider(t, template);
  const parentProvider = getTemplateParentProvider(template);

  return (
    <div className={className}>
      {templateSupport.parent === 'Full' && parentProvider && (
        <Tooltip
          content={t('kubevirt-plugin~{{provider}} supported', { provider: parentProvider })}
        >
          <Label data-test="template-support-parent" isTruncated color="green">
            {parentProvider}
          </Label>
        </Tooltip>
      )}
      {templateSupport.provider === 'Full' && provider && (
        <Tooltip content={t('kubevirt-plugin~{{provider}} supported', { provider })}>
          <Label
            data-test="template-support"
            color={isCommonTemplate(template) ? 'green' : 'blue'}
            isTruncated
          >
            {provider}
          </Label>
        </Tooltip>
      )}
    </div>
  );
};
