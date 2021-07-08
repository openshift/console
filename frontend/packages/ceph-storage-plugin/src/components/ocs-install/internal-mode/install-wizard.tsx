import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { match as RouteMatch } from 'react-router';
import { Link } from 'react-router-dom';
import {
  Alert,
  Wizard,
  AlertActionCloseButton,
  Stack,
  StackItem,
  WizardStep,
} from '@patternfly/react-core';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { setFlag } from '@console/internal/actions/features';
import { k8sCreate, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { SelectCapacityAndNodes, Configure, ReviewAndCreate } from './install-wizard-steps';
import { initialState, reducer, InternalClusterState } from './reducer';
import { taintNodes } from '../../../utils/install';
import { OCSServiceModel } from '../../../models';
import { OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../../features';
import { MODES, OCS_INTERNAL_CR_NAME, MINIMUM_NODES, CreateStepsSC } from '../../../constants';
import { StorageClusterKind, NetworkType, NavUtils } from '../../../types';
import { labelNodes, getOCSRequestData, labelOCSNamespace } from '../ocs-request-data';
import { createKmsResources } from '../../kms-config/utils';
import '../install-wizard/install-wizard.scss';

const makeOCSRequest = (state: InternalClusterState): Promise<StorageClusterKind> => {
  const {
    storageClass,
    capacity,
    nodes,
    enableMinimal,
    enableFlexibleScaling,
    publicNetwork,
    clusterNetwork,
    encryption,
    kms,
    enableTaint,
  } = state;
  const storageCluster: StorageClusterKind = getOCSRequestData(
    storageClass,
    capacity,
    encryption.clusterWide,
    enableMinimal,
    enableFlexibleScaling,
    publicNetwork,
    clusterNetwork,
    kms.hasHandled && encryption.advanced,
  );
  const promises: Promise<K8sResourceKind>[] = [...labelNodes(nodes), labelOCSNamespace()];
  if (encryption.advanced && kms.hasHandled) {
    promises.push(...createKmsResources(kms));
  }
  if (enableTaint) {
    promises.push(...taintNodes(nodes));
  }
  return Promise.all(promises).then(() => k8sCreate(OCSServiceModel, storageCluster));
};

export const CreateInternalCluster: React.FC<CreateInternalClusterProps> = ({
  match,
  mode,
  navUtils,
}) => {
  const { t } = useTranslation();
  const { appName, ns } = match.params;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const flagDispatcher = useDispatch();

  const title = t('ceph-storage-plugin~create internal mode StorageCluster wizard');
  const scName = getName(state.storageClass);
  const hasConfiguredNetwork =
    state.networkType === NetworkType.MULTUS
      ? !!(state.publicNetwork || state.clusterNetwork)
      : true;
  const hasEnabledCreateStep =
    !!(state.nodes.length >= MINIMUM_NODES && scName && state.kms.hasHandled) &&
    hasConfiguredNetwork;
  const { getStep, getParamString, getIndex, getAnchor } = navUtils;

  const toLink = (steps: any, currentStep: string, modes: any) =>
    getAnchor(getIndex(steps, currentStep, 2), getIndex(modes, modes.INTERNAL));

  const steps: WizardStep[] = [
    {
      name: (
        <Link to={toLink(CreateStepsSC, CreateStepsSC.STORAGEANDNODES, MODES)}>
          {' '}
          {t('ceph-storage-plugin~Capacity and nodes')}{' '}
        </Link>
      ),
      id: CreateStepsSC.STORAGEANDNODES,
      component: <SelectCapacityAndNodes state={state} dispatch={dispatch} mode={mode} />,
      enableNext: !!(state.nodes.length >= MINIMUM_NODES && scName),
    },
    {
      name: (
        <Link to={toLink(CreateStepsSC, CreateStepsSC.CONFIGURE, MODES)}>
          {' '}
          {t('ceph-storage-plugin~Security and network')}{' '}
        </Link>
      ),
      id: CreateStepsSC.CONFIGURE,
      component: <Configure state={state} dispatch={dispatch} mode={mode} />,
      enableNext: state.encryption.hasHandled && hasConfiguredNetwork && state.kms.hasHandled,
    },
    {
      name: (
        <Link to={toLink(CreateStepsSC, CreateStepsSC.REVIEWANDCREATE, MODES)}>
          {' '}
          {t('ceph-storage-plugin~Review and create')}{' '}
        </Link>
      ),
      id: CreateStepsSC.REVIEWANDCREATE,
      component: (
        <ReviewAndCreate state={state} errorMessage={errorMessage} inProgress={inProgress} />
      ),
      enableNext: hasEnabledCreateStep,
      nextButtonText: t('ceph-storage-plugin~Create'),
    },
  ];

  const createCluster = async () => {
    try {
      setInProgress(true);
      await makeOCSRequest(state);
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, true));
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, false));
      flagDispatcher(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Stack>
      <StackItem>
        {showInfoAlert && (
          <Alert
            variant="info"
            className="co-alert ocs-install-info-alert"
            title="Internal"
            actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
            isInline
          >
            <p>
              {t(
                'ceph-storage-plugin~Can be used on any platform, except bare metal. It means that OpenShift Container Storage uses an infrastructure StorageClass, provided by the hosting platform. For example, gp2 on AWS, thin on VMWare, etc.',
              )}
            </p>
          </Alert>
        )}
      </StackItem>
      <StackItem isFilled>
        <Wizard
          className="ocs-install-wizard"
          navAriaLabel={t('ceph-storage-plugin~{{title}} steps', { title })}
          mainAriaLabel={t('ceph-storage-plugin~{{title}} content', { title })}
          steps={steps}
          cancelButtonText={t('ceph-storage-plugin~Cancel')}
          nextButtonText={t('ceph-storage-plugin~Next')}
          backButtonText={t('ceph-storage-plugin~Back')}
          startAtStep={getStep()}
          onBack={() => {
            history.push(`~new?${getParamString(getStep(3) - 1, getIndex(MODES, MODES.INTERNAL))}`);
          }}
          onNext={() => {
            history.push(`~new?${getParamString(getStep(3) + 1, getIndex(MODES, MODES.INTERNAL))}`);
          }}
          onClose={() =>
            history.push(resourcePathFromModel(ClusterServiceVersionModel, appName, ns))
          }
          onSave={createCluster}
        />
      </StackItem>
    </Stack>
  );
};

type CreateInternalClusterProps = {
  navUtils: NavUtils;
  match: RouteMatch<{ appName: string; ns: string }>;
  mode: string;
};
