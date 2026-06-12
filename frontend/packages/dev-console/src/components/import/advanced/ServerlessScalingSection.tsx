import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NumberSpinnerField } from '@console/shared/src/components/formik-fields/NumberSpinnerField';
import { ResourceLimitField } from '@console/shared/src/components/formik-fields/ResourceLimitField';
import FormSection from '../section/FormSection';

const ServerlessScalingSection: FC = () => {
  const { t } = useTranslation('devconsole');
  const AutoscaleWindowUnits = {
    s: t('Sec'),
    m: t('Min'),
    h: t('Hrs'),
  };

  return (
    <FormSection
      title={t('Scaling')}
      subTitle={t(
        'devconsole~Set the autoscaler parameters around pods and concurrency limits in this section.',
      )}
    >
      <NumberSpinnerField
        name="serverless.scaling.minpods"
        label={t('Min Pods')}
        helpText={t(
          'devconsole~The lower limit for the number of Pods that can be set by autoscaler. If not specified defaults to 0.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.maxpods"
        label={t('Max Pods')}
        helpText={t(
          'devconsole~The upper limit for the number of Pods that can be set by autoscaler.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencytarget"
        label={t('Concurrency target')}
        helpText={t(
          'devconsole~Defines how many concurrent requests are wanted per instance of the application at a given time (soft limit) and is the recommended configuration for autoscaling. If not specified, will be defaulted to the value set in the Cluster config.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencylimit"
        label={t('Concurrency limit')}
        helpText={t(
          'devconsole~Limits the amount of concurrent requests allowed into one instance of the application at a given time (hard limit), and is configured in the revision template. If not specified, will be defaulted to the value set in the Cluster config.',
        )}
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencyutilization"
        label={t('Concurrency utilization')}
        helpText={t('Percentage of concurrent requests utilization before scaling up.')}
      />
      <ResourceLimitField
        name="serverless.scaling.autoscale.autoscalewindow"
        label={t('Autoscale window')}
        unitName="serverless.scaling.autoscale.autoscalewindowUnit"
        unitOptions={AutoscaleWindowUnits}
        helpText={t(
          'devconsole~Duration to look back for making auto-scaling decisions. The service is scaled to zero if no request was received in during that time.',
        )}
      />
    </FormSection>
  );
};

export default ServerlessScalingSection;
