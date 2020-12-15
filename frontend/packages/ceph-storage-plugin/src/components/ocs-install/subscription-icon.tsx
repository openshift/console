import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Label, Tooltip } from '@patternfly/react-core';
import InfoCircleIcon from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import './subscription-icon.scss';

export const AdvancedSubscription: React.FC<AdvancedSubscriptionProps> = ({ prefix }) => {
  const { t } = useTranslation();
  return (
    <>
      {prefix}{' '}
      <Tooltip
        content={t(
          'ceph-storage-plugin~This is an Advanced subscription feature. It requires Advanced Edition subscription. Please contact the account team for more information.',
        )}
      >
        <Label
          icon={<InfoCircleIcon />}
          color="purple"
          variant="filled"
          className="ceph__subscription"
        >
          {t('ceph-storage-plugin~Advanced Subscription')}
        </Label>
      </Tooltip>
    </>
  );
};

type AdvancedSubscriptionProps = {
  prefix?: string;
};
