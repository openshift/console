import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import {
  Wizard,
  WizardFooter,
  WizardContextConsumer,
  Button,
  Alert,
  WizardStep,
  AlertActionCloseButton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { setFlag } from '@console/internal/actions/features';
import { k8sCreate, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { getName } from '@console/shared';
import { initialState, reducer } from './reducer';
import {
  DiscoverDisks,
  makeLocalVolumeDiscoverRequest,
} from './install-wizard-steps/discover-disks-step';
import { CreateStorageClass } from './install-wizard-steps/create-storage-class/create-storage-class-step';
import { StorageAndNodes } from './install-wizard-steps/storage-and-nodes-step';
import { ReviewAndCreate } from './install-wizard-steps/review-and-create-step';
import { Configure } from './install-wizard-steps/configure-step';
import { taintNodes } from '../../../utils/install';
import {
  CreateStepsSC,
  MINIMUM_NODES,
  defaultRequestSize,
  OCS_INTERNAL_CR_NAME,
} from '../../../constants';
import { StorageClusterKind } from '../../../types';
import { getOCSRequestData, labelNodes, labelOCSNamespace } from '../ocs-request-data';
import { OCSServiceModel } from '../../../models';
import { OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../../features';
import { createKmsResources } from '../../kms-config/utils';
import '../install-wizard/install-wizard.scss';
import './attached-devices.scss';

const createCluster = async (
  {
    storageClass,
    encryption,
    nodes,
    enableMinimal,
    enableFlexibleScaling,
    kms,
    publicNetwork,
    clusterNetwork,
    selectedArbiterZone,
    stretchClusterChecked,
    enableTaint,
  },
  setInProgress,
  flagDispatcher,
  setErrorMessage,
  ns,
  appName,
) => {
  try {
    setInProgress(true);

    const storageCluster: StorageClusterKind = getOCSRequestData(
      storageClass,
      defaultRequestSize.BAREMETAL,
      encryption.clusterWide,
      enableMinimal,
      enableFlexibleScaling,
      publicNetwork,
      clusterNetwork,
      kms.hasHandled && encryption.advanced,
      selectedArbiterZone,
      stretchClusterChecked,
    );
    const promises: Promise<K8sResourceKind>[] = [...labelNodes(nodes), labelOCSNamespace()];
    if (encryption.advanced && kms.hasHandled) {
      promises.push(...createKmsResources(kms));
    }
    if (enableTaint) {
      promises.push(...taintNodes(nodes));
    }
    await Promise.all(promises).then(() => k8sCreate(OCSServiceModel, storageCluster));
    flagDispatcher(setFlag(OCS_ATTACHED_DEVICES_FLAG, true));
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

const CreateStorageClusterWizard: React.FC<CreateStorageClusterWizardProps> = ({
  match,
  hasNoProvSC,
  mode,
  lsoNs,
}) => {
  const { t } = useTranslation();
  const { appName, ns } = match.params;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const flagDispatcher = useDispatch();

  const discoveryNodes = state.lvdIsSelectNodes ? state.lvdSelectNodes : state.lvdAllNodes;

  /**
   * This custom footer for wizard provides a control over the movement to next step.
   * This allows error handling per step and moves to next step only when API request is successful.
   */
  const CustomFooter: React.ReactNode = (
    <WizardFooter>
      <WizardContextConsumer>
        {({ activeStep, onNext, onBack, onClose }) => {
          const nextButtonFactory = {
            [CreateStepsSC.DISCOVER]: {
              onNextClick: () =>
                makeLocalVolumeDiscoverRequest(discoveryNodes, dispatch, lsoNs, onNext),
              isNextDisabled: state.lvdInProgress || discoveryNodes.length < MINIMUM_NODES,
            },
            [CreateStepsSC.STORAGECLASS]: {
              onNextClick: () => dispatch({ type: 'setShowConfirmModal', value: true }),
              isNextDisabled:
                state.chartNodes.size < MINIMUM_NODES ||
                !state.volumeSetName.trim().length ||
                !state.isValidDiskSize,
            },
            [CreateStepsSC.STORAGEANDNODES]: {
              onNextClick: () => onNext(),
              isNextDisabled: state.nodes.length < MINIMUM_NODES || !getName(state.storageClass),
            },
            [CreateStepsSC.CONFIGURE]: {
              onNextClick: () => onNext(),
              isNextDisabled: !state.encryption.hasHandled || !state.kms.hasHandled,
            },
            [CreateStepsSC.REVIEWANDCREATE]: {
              onNextClick: () =>
                createCluster(state, setInProgress, flagDispatcher, setErrorMessage, ns, appName),
              isNextDisabled:
                state.nodes.length < MINIMUM_NODES ||
                !getName(state.storageClass) ||
                !state.kms.hasHandled,
            },
          };
          const { id } = activeStep;

          return (
            <>
              <Button
                variant="primary"
                type="submit"
                isDisabled={nextButtonFactory[id].isNextDisabled}
                onClick={nextButtonFactory[id].onNextClick}
              >
                {id === CreateStepsSC.REVIEWANDCREATE
                  ? t('ceph-storage-plugin~Create')
                  : t('ceph-storage-plugin~Next')}
              </Button>
              <Button
                variant="secondary"
                onClick={onBack}
                isDisabled={id === CreateStepsSC.DISCOVER}
              >
                {t('ceph-storage-plugin~Back')}
              </Button>
              <Button variant="link" onClick={onClose}>
                {t('ceph-storage-plugin~Cancel')}
              </Button>
            </>
          );
        }}
      </WizardContextConsumer>
    </WizardFooter>
  );

  const steps: WizardStep[] = [
    {
      id: CreateStepsSC.DISCOVER,
      name: t('ceph-storage-plugin~Discover Disks'),
      component: (
        <DiscoverDisks
          inProgress={state.lvdInProgress}
          error={state.lvdError}
          allNodes={state.lvdAllNodes}
          selectNodes={state.lvdSelectNodes}
          isSelectNodes={state.lvdIsSelectNodes}
          dispatch={dispatch}
        />
      ),
    },
    {
      id: CreateStepsSC.STORAGECLASS,
      name: t('ceph-storage-plugin~Create Storage Class'),
      component: <CreateStorageClass dispatch={dispatch} state={state} ns={lsoNs} />,
    },
    {
      id: CreateStepsSC.STORAGEANDNODES,
      name: t('ceph-storage-plugin~Storage and Nodes'),
      component: <StorageAndNodes dispatch={dispatch} state={state} mode={mode} />,
    },
    {
      id: CreateStepsSC.CONFIGURE,
      name: t('ceph-storage-plugin~Configure'),
      component: <Configure dispatch={dispatch} state={state} mode={mode} />,
    },
    {
      id: CreateStepsSC.REVIEWANDCREATE,
      name: t('ceph-storage-plugin~Review and Create'),
      nextButtonText: t('ceph-storage-plugin~Create'),
      component: (
        <ReviewAndCreate state={state} inProgress={inProgress} errorMessage={errorMessage} />
      ),
    },
  ];

  return (
    <Stack>
      <StackItem>
        {showInfoAlert && (
          <Alert
            className="co-alert ocs-install-info-alert"
            variant="info"
            isInline
            title={
              !hasNoProvSC
                ? t('ceph-storage-plugin~Missing storage class')
                : 'Internal - Attached devices'
            }
            actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
          >
            {!hasNoProvSC
              ? t(
                  'ceph-storage-plugin~The storage cluster needs to use a storage class to consume the local storage. In order to create one you need to discover the available disks and create a storage class using the filters to select the disks you wish to use',
                )
              : t(
                  'ceph-storage-plugin~Can be used on any platform. It means that OCS uses attached disks, via Local Storage Operator. In this case, the infrastructure storage class is actually provided by LSO, on top of attached drives.',
                )}
          </Alert>
        )}
      </StackItem>
      <StackItem isFilled>
        <Wizard
          className="ocs-install-wizard"
          steps={steps}
          startAtStep={hasNoProvSC ? 3 : 1}
          onClose={() =>
            history.push(resourcePathFromModel(ClusterServiceVersionModel, appName, ns))
          }
          footer={CustomFooter}
          cancelButtonText={t('ceph-storage-plugin~Cancel')}
          nextButtonText={t('ceph-storage-plugin~Next')}
          backButtonText={t('ceph-storage-plugin~Back')}
        />
      </StackItem>
    </Stack>
  );
};

type CreateStorageClusterWizardProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
  hasNoProvSC: boolean;
  setHasNoProvSC: React.Dispatch<React.SetStateAction<boolean>>;
  mode: string;
  lsoNs: string;
};

export default CreateStorageClusterWizard;
