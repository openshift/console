import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NumberSpinnerField } from '@console/shared';
import FormSection from '../section/FormSection';

const ServerlessScalingSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormSection
      title={t('devconsole~Scaling')}
      subTitle={t(
        'devconsole~Set the autoscaler parameters around pods and concurrency limits in this section.',
      )}
    >
      <NumberSpinnerField
        name="serverless.scaling.minpods"
        label={t('devconsole~Min Pods')}
        helpText={t(
          'devconsole~The lower limit for the number of Pods that can be set by autoscaler. If not specified defaults to 0.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.maxpods"
        label={t('devconsole~Max Pods')}
        helpText={t(
          'devconsole~The upper limit for the number of Pods that can be set by autoscaler.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencytarget"
        label={t('devconsole~Concurrency target')}
        helpText={t(
          'devconsole~Defines how many concurrent requests are wanted per instance of the Application at a given time (soft limit) and is the recommended configuration for autoscaling. If not specified, will be defaulted to the value set in the Cluster config.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencylimit"
        label={t('devconsole~Concurrency limit')}
        helpText={t(
          'devconsole~Limits the amount of concurrent requests allowed into one instance of the Application at a given time (hard limit), and is configured in the revision template. If not specified, will be defaulted to the value set in the Cluster config.',
        )}
      />
    </FormSection>
  );
};

export default ServerlessScalingSection;
