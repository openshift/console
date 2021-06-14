import * as React from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TemplateKind } from '@console/internal/module/k8s';
import { getTemplateProvider } from '../../selectors/vm-template/basic';

type VMTemplateLabelProps = {
  template: TemplateKind;
  className?: string;
  showProvider?: boolean;
};

export const VMTemplateLabel: React.FC<VMTemplateLabelProps> = ({
  template,
  className,
  showProvider,
}) => {
  const { t } = useTranslation();
  const provider = getTemplateProvider(t, template);

  return (
    <div className={className}>
      <Tooltip content={t('kubevirt-plugin~Community Supported')}>
        <span>
          {showProvider ? provider : null}{' '}
          <Label data-test="template-support" color="green" isTruncated>
            {t('kubevirt-plugin~Community')}
          </Label>
        </span>
      </Tooltip>
    </div>
  );
};
