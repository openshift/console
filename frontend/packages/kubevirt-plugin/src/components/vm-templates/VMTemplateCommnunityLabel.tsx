import * as React from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TemplateKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src';
import { getTemplateProvider } from '../../selectors/vm-template/basic';

type VMTemplateLabelProps = {
  template: TemplateKind;
  className?: string;
};

// Documentation on what OS are supported (e.g. not comunity)
// https://access.redhat.com/articles/973163#ocpvirt
const supportedTemplates = [
  'rhel6',
  'rhel7',
  'rhel8',
  'windows2k12r2',
  'windows2k16',
  'windows2k19',
  'windows10',
];

export const VMTemplateCommnunityLabel: React.FC<VMTemplateLabelProps> = ({
  template,
  className,
}) => {
  const { t } = useTranslation();
  const provider = getTemplateProvider(t, template);
  const templateOSName = getName(template).split('-')?.[0];
  const isCommunity = !(
    ['red hat', 'redhat'].includes(provider.toLowerCase()) &&
    supportedTemplates.includes(templateOSName)
  );

  if (!isCommunity) {
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
