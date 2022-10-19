import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import {
  global_palette_green_500 as okColor,
  global_palette_red_100 as errorColor,
} from '@patternfly/react-tokens';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  StatusPopupItem,
  StatusPopupSection,
  useK8sWatchResource,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ClusterOperator } from '@console/internal/module/k8s';
import { CONSOLE_PREFIX_CLUSTER_OPERATOR, getCondition } from '../resources';
import { K8sResourceConditionStatus } from '../resources/k8sResource';

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
  icon: React.ReactNode | undefined;
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

const useOperatorHealth = (t: TFunction, name: string): OperatorHealthType => {
  const [operator, isLoaded, error] = useK8sWatchResource<ClusterOperator>({
    groupVersionKind: { group: 'config.openshift.io', version: 'v1', kind: 'ClusterOperator' },
    name,
    isList: false,
    namespaced: false,
  });

  if (!isLoaded) {
    return {
      message: t('vsphere-plugin~Pending'),
      icon: <InProgressIcon />,
      level: OperatorHealthLevel.Unknown,
    };
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load operator "${name}": `, error);
    return {
      message: t('vsphere-plugin~Error'),
      icon: <ExclamationCircleIcon color={errorColor.value} />,
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
      message: t('vsphere-plugin~Progressing'),
      icon: <InProgressIcon />,
      level: OperatorHealthLevel.Progressing,
    };
  }

  if (degraded === 'True') {
    return {
      message: t('vsphere-plugin~Degraded'),
      icon: <ExclamationCircleIcon color={errorColor.value} />,
      level: OperatorHealthLevel.Degraded,
    };
  }

  if (available === 'True') {
    return {
      message: t('vsphere-plugin~Healthy'),
      icon: <CheckCircleIcon color={okColor.value} />,
      level: OperatorHealthLevel.Healthy,
    };
  }

  return {
    message: t('vsphere-plugin~Unknown'),
    icon: <UnknownIcon />,
    level: OperatorHealthLevel.Unknown,
  };
};

export const VSphereOperatorStatuses: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const kubeControllerManager = useOperatorHealth(t, 'kube-controller-manager');
  const kubeApiServer = useOperatorHealth(t, 'kube-apiserver');
  const storage = useOperatorHealth(t, 'storage');

  const onToggle = (value: boolean) => {
    setIsExpanded(value);
  };

  const worstIconState = getWorstIconState([kubeApiServer, kubeControllerManager, storage]);

  return (
    <ExpandableSection
      toggleContent={
        <span>
          {t('vsphere-plugin~Monitored operators')} {isExpanded ? null : worstIconState}
        </span>
      }
      onToggle={onToggle}
      isExpanded={isExpanded}
    >
      <StatusPopupSection
        firstColumn={t('vsphere-plugin~Operator')}
        secondColumn={t('vsphere-plugin~Status')}
      >
        <StatusPopupItem value={kubeApiServer.message} icon={kubeApiServer.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/kube-apiserver`}>
            {t('vsphere-plugin~Kube API Server')}
          </Link>
        </StatusPopupItem>

        <StatusPopupItem value={kubeControllerManager.message} icon={kubeControllerManager.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/kube-controller-manager`}>
            {t('vsphere-plugin~Kube Controller Manager')}
          </Link>
        </StatusPopupItem>

        <StatusPopupItem value={storage.message} icon={storage.icon}>
          <Link to={`${CONSOLE_PREFIX_CLUSTER_OPERATOR}/storage`}>
            {t('vsphere-plugin~Storage')}
          </Link>
        </StatusPopupItem>
      </StatusPopupSection>
    </ExpandableSection>
  );
};
