import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, isUpstream } from '@console/internal/components/utils';
import { SUPPORT_URL } from '../../constants/vm-templates';

const VMTemplateSupport: React.FC<VMTemplateSupportProps> = ({ details }) => {
  const { t } = useTranslation();
  return (
    !isUpstream() && (
      <div>
        {details
          ? t('kubevirt-plugin~See template details for support.')
          : t('kubevirt-plugin~Supported operating systems are labeled below.')}{' '}
        <ExternalLink
          href={SUPPORT_URL}
          text={t('kubevirt-plugin~Learn more about Red Hat support')}
        />
      </div>
    )
  );
};

type VMTemplateSupportProps = {
  details?: boolean;
};

export default VMTemplateSupport;
