import * as React from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TemplateKind } from '@console/internal/module/k8s';
import { getTemplateProvider, getTemplateSupport } from '../../selectors/vm-template/basic';

type VMTemplateLabelProps = {
  template: TemplateKind;
  className?: string;
};

export const VMTemplateCommnunityLabel: React.FC<VMTemplateLabelProps> = ({
  template,
  className,
}) => {
  const { t } = useTranslation();
  const provider = getTemplateProvider(t, template);
  const templateSupport = getTemplateSupport(template);
  const isRedHatCommunity =
    ['red hat', 'redhat'].includes(provider.toLowerCase()) && templateSupport.provider !== 'Full';

  if (!isRedHatCommunity) {
    return null;
  }

  return (
    <Tooltip content={t('kubevirt-plugin~Community Supported')}>
      <Label data-test="template-support" color="green" className={className} isTruncated>
        {t('kubevirt-plugin~Community')}
      </Label>
    </Tooltip>
  );
};
