import type { ReactNode, FC } from 'react';
import { useState } from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import {
  RhUiCheckCircleFillIcon,
  RhUiErrorFillIcon,
  RhUiInProgressIcon,
  RhUiUnknownIcon,
} from '@patternfly/react-icons';
import {
  t_color_green_50 as okColor,
  t_color_red_60 as errorColor,
} from '@patternfly/react-tokens';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  StatusPopupItem,
  StatusPopupSection,
  useK8sWatchResource,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import type { ClusterOperator } from '@console/internal/module/k8s';
import { CONSOLE_PREFIX_CLUSTER_OPERATOR } from '../resources/clusterOperator';
import type { K8sResourceConditionStatus } from '../resources/k8sResource';
import { getCondition } from '../resources/statusCondition';

let ohlCounter = 0;
const OperatorHealthLevel: { [key: string]: number } = {
  // The order matters!
  Unknown: ohlCounter++,
  Healthy: ohlCounter++,
  Progressing: ohlCounter++,
  Degraded: ohlCounter++,
  Error: ohlCounter++,
};

type OperatorHealthType = {
  message: string;
  icon: ReactNode | undefined;
  level: number;
};

const getWorstIconState = (states: OperatorHealthType[]): OperatorHealthType['icon'] => {
  let worst = states[0];
  states.forEach((state) => {
    if (worst.level < state.level) {
      worst = state;
    }
  });

  return worst.icon;
};

const useOperatorHealth = (name: string): OperatorHealthType => {
  const [operator, isLoaded, error] = useK8sWatchResource<ClusterOperator>({
    groupVersionKind: { group: 'config.openshift.io', version: 'v1', kind: 'ClusterOperator' },
    name,
    isList: false,
    namespaced: false,
  });
  const { t } = useTranslation('vsphere-plugin');

  if (!isLoaded) {
    return {
      message: t('Pending'),
      icon: <RhUiInProgressIcon />,
      level: OperatorHealthLevel.Unknown,
    };
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load operator "${name}": `, error);
    return {
      message: t('Error'),
      icon: <RhUiErrorFillIcon color={errorColor.value} />,
      level: OperatorHealthLevel.Error,
    };
  }

  const progressing = getCondition(operator, 'Progressing')?.status as
    | K8sResourceConditionStatus
    | undefined;
  const available = getCondition(operator, 'Available')?.status as
    | K8sResourceConditionStatus
    | undefined;
  const degraded = getCondition(operator, 'Degraded')?.status as
    | K8sResourceConditionStatus
    | undefined;

  if (progressing === 'True') {
    return {
      message: t('Progressing'),
      icon: <RhUiInProgressIcon />,
      level: OperatorHealthLevel.Progressing,
    };
  }

  if (degraded === 'True') {
    return {
      message: t('Degraded'),
      icon: <RhUiErrorFillIcon color={errorColor.value} />,
      level: OperatorHealthLevel.Degraded,
    };
  }

  if (available === 'True') {
    return {
      message: t('Healthy'),
      icon: <RhUiCheckCircleFillIcon color={okColor.value} />,
      level: OperatorHealthLevel.Healthy,
    };
  }

  return {
    message: t('Unknown'),
    icon: <RhUiUnknownIcon />,
    level: OperatorHealthLevel.Unknown,
  };
};

export const VSphereOperatorStatuses: FC = () => {
  const { t } = useTranslation('vsphere-plugin');
  const [isExpanded, setIsExpanded] = useState(false);

  const kubeControllerManager = useOperatorHealth('kube-controller-manager');
  const kubeApiServer = useOperatorHealth('kube-apiserver');
  const storage = useOperatorHealth('storage');

  const onToggle = (_event, value: boolean) => {
    setIsExpanded(value);
  };

  const worstIconState = getWorstIconState([kubeApiServer, kubeControllerManager, storage]);

  return (
    <ExpandableSection
      toggleContent={
        <span>
          {t('Monitored operators')} {isExpanded ? null : worstIconState}
        </span>
      }
      onToggle={onToggle}
      isExpanded={isExpanded}
    >
      <StatusPopupSection firstColumn={t('Operator')} secondColumn={t('Status')}>
        <StatusPopupItem value={kubeApiServer.message} icon={kubeApiServer.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/kube-apiserver`}>
            {t('Kube API Server')}
          </Link>
        </StatusPopupItem>

        <StatusPopupItem value={kubeControllerManager.message} icon={kubeControllerManager.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/kube-controller-manager`}>
            {t('Kube Controller Manager')}
          </Link>
        </StatusPopupItem>

        <StatusPopupItem value={storage.message} icon={storage.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/storage`}>{t('Storage')}</Link>
        </StatusPopupItem>
      </StatusPopupSection>
    </ExpandableSection>
  );
};
