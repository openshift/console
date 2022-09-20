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
  k8sGet,
  StatusPopupItem,
  StatusPopupSection,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ClusterOperatorModel } from '@console/internal/models';
import { ClusterOperator } from '@console/internal/module/k8s';
import { DELAY_BEFORE_POLLING_RETRY_MEDIUM } from '../constants';
import { BooleanString, CONSOLE_PREFIX_CLUSTER_OPERATOR, getCondition } from '../resources';
import { delay } from './utils';

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

const getOperatorHealth = async (t: TFunction, name: string): Promise<OperatorHealthType> => {
  try {
    const operator = await k8sGet<ClusterOperator>({ model: ClusterOperatorModel, name });

    const progressing = getCondition(operator, 'Progressing')?.status as BooleanString | undefined;
    const available = getCondition(operator, 'Available')?.status as BooleanString | undefined;
    const degraded = getCondition(operator, 'Degraded')?.status as BooleanString | undefined;

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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error getting operator status: ', name, e);
    return {
      message: t('vsphere-plugin~Error'),
      icon: <ExclamationCircleIcon color={errorColor.value} />,
      level: OperatorHealthLevel.Error,
    };
  }
};

export const VSphereOperatorStatuses: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const initialHealth = {
    message: t('vsphere-plugin~Pending'),
    icon: <InProgressIcon />,
    level: OperatorHealthLevel.Unknown,
  };
  const [kubeControllerManager, setKubeControllerManager] = React.useState<OperatorHealthType>(
    initialHealth,
  );
  const [kubeApiServer, setKubeApiServer] = React.useState<OperatorHealthType>(initialHealth);
  const [storage, setStorage] = React.useState<OperatorHealthType>(initialHealth);

  const [pollingTimmer, setPollingTimmer] = React.useState<number>(0);

  React.useEffect(() => {
    const doItAsync = async () => {
      setKubeControllerManager(await getOperatorHealth(t, 'kube-controller-manager'));
      setKubeApiServer(await getOperatorHealth(t, 'kube-apiserver'));
      setStorage(await getOperatorHealth(t, 'storage'));

      await delay(DELAY_BEFORE_POLLING_RETRY_MEDIUM);
      setPollingTimmer(pollingTimmer + 1);
    };

    doItAsync();
  }, [pollingTimmer, t]);

  const onToggle = (value: boolean) => {
    setIsExpanded(value);
  };

  // TODO: calculate from all vSphere-related operators
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
