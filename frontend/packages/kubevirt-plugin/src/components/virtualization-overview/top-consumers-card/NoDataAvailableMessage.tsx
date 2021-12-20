import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FieldLevelHelp } from '@console/internal/components/utils';

import './top-consumers-card.scss';

const nonVCPULink =
  'https://access.redhat.com/documentation/fr-fr/openshift_container_platform/4.8/html/openshift_virtualization/logging-events-and-monitoring#virt-querying-metrics_virt-prometheus-queries';
const vcpuLink =
  'https://access.redhat.com/documentation/fr-fr/openshift_container_platform/4.8/html/openshift_virtualization/logging-events-and-monitoring#virt-promql-vcpu-metrics_virt-prometheus-queries';

type NoDataAvailableMessageProps = {
  isVCPU: boolean;
};

export const NoDataAvailableMessage: React.FC<NoDataAvailableMessageProps> = ({
  isVCPU = false,
}) => {
  const { t } = useTranslation();

  const nonVCPUMessage = t(
    'kubevirt-plugin~Metrics are collected by the OpenShift Monitoring Operator.',
  );
  const vcpuMessage = t(
    'kubevirt-plugin~To see the vCPU metric, you must set the schedstats=enable kernel argument in the MachineConfig object.',
  );

  const bodyContent = (
    <div>
      {isVCPU ? vcpuMessage : nonVCPUMessage}
      <div>
        {' '}
        <div className="kv-top-consumers-card__chart-list-no-data-msg--link">
          <ExternalLink
            href={isVCPU ? vcpuLink : nonVCPULink}
            text={t('kubevirt-plugin~Learn more')}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="kv-top-consumers-card__chart-list-no-data-msg pf-u-text-align-center">
      {t('kubevirt-plugin~No data available')}
      <FieldLevelHelp>{bodyContent}</FieldLevelHelp>
    </div>
  );
};
