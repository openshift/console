import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import type { FormikHelpers, FormikValues } from 'formik';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory';
import {
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalWrapper,
} from '@console/internal/components/factory';
import { resourceListPathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sKill, k8sPatch, referenceForModel } from '@console/internal/module/k8s';
import { RedExclamationCircleIcon } from '@console/shared';
import { KNATIVE_SERVING_LABEL } from '../../const';
import { ConfigurationModel, RevisionModel, ServiceModel } from '../../models';
import { getKnativeRevisionsData } from '../../topology/knative-topology-utils';
import type { Traffic } from '../../types';
import { getRevisionItems, trafficDataForPatch } from '../../utils/traffic-splitting-utils';
import type { TrafficSplittingType } from '../traffic-splitting/TrafficSplitting';
import DeleteRevisionModal from './DeleteRevisionModal';

type DeleteRevisionModalControllerProps = {
  revision: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
};

const DeleteRevisionModalController: FC<DeleteRevisionModalControllerProps> = ({
  revision,
  cancel,
  close,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { namespace } = revision.metadata;

  const watchResources = useMemo(
    () => ({
      revisions: {
        isList: true,
        kind: referenceForModel(RevisionModel),
        namespace,
        optional: true,
      },
      configurations: {
        isList: true,
        kind: referenceForModel(ConfigurationModel),
        namespace,
        optional: true,
      },
      services: {
        isList: true,
        kind: referenceForModel(ServiceModel),
        namespace,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{
    revisions: K8sResourceKind[];
    configurations: K8sResourceKind[];
    services: K8sResourceKind[];
  }>(watchResources);

  const loaded =
    Object.keys(resources).length > 0 &&
    Object.keys(resources).every((key) => resources[key].loaded);

  if (!loaded) {
    return null;
  }

  const service = resources.services.data.find((s: K8sResourceKind) => {
    return revision.metadata.labels[KNATIVE_SERVING_LABEL] === s.metadata.name;
  });

  const revisions = getKnativeRevisionsData(service, resources).filter(
    (r) => revision.metadata.uid !== r.metadata.uid,
  );

  if (revisions.length === 0) {
    return (
      <form className="modal-content" onSubmit={close}>
        <ModalTitle>
          <RedExclamationCircleIcon className="co-icon-space-r" />
          {t('knative-plugin~Unable to delete {{revlabel}}', { revlabel: RevisionModel.label })}
        </ModalTitle>
        <ModalBody>
          <p>
            {t('knative-plugin~You cannot delete the last {{revlabel}} for the {{serviceLabel}}.', {
              revlabel: RevisionModel.label,
              serviceLabel: ServiceModel.label,
            })}
          </p>
        </ModalBody>
        <ModalFooter inProgress={false}>
          <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
            <Button
              type="button"
              variant="secondary"
              data-test-id="modal-cancel-action"
              onClick={close}
            >
              {t('knative-plugin~OK')}
            </Button>
          </ActionGroup>
        </ModalFooter>
      </form>
    );
  }

  const revisionItems = getRevisionItems(revisions);

  const traffic = service?.spec?.traffic ?? [{ percent: 0, tag: '', revisionName: '' }];
  const deleteTraffic = traffic.find((tr) => tr.revisionName === revision.metadata.name);

  const initialValues: TrafficSplittingType = {
    trafficSplitting: traffic.reduce((acc: Traffic[], tr) => {
      if (!tr.revisionName || revisions.find((r) => r.metadata.name === tr.revisionName)) {
        const trafficIndex = acc.findIndex((val) => val.revisionName === tr.revisionName);
        if (trafficIndex >= 0) {
          acc[trafficIndex].percent += tr.percent;
        } else {
          acc.push({
            percent: tr.percent,
            tag: tr.tag || '',
            revisionName: tr.revisionName || '',
          });
        }
      }
      return acc;
    }, []),
  };

  if (initialValues.trafficSplitting.length === 0 && revisions.length > 0) {
    initialValues.trafficSplitting.push({
      percent: 0,
      tag: '',
      revisionName: revisions[0].metadata.name,
    });
  }

  const deleteRevisionAction = (action: FormikHelpers<FormikValues>) => {
    return k8sKill(RevisionModel, revision)
      .then(() => {
        close();
        // If we are currently on the deleted revision's page, redirect to the list page
        const re = new RegExp(`/${revision.metadata.name}(/|$)`);
        if (re.test(window.location.pathname)) {
          navigate(resourceListPathFromModel(RevisionModel, revision.metadata.namespace));
        }
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({ error: errMessage });
      });
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const ksvcPatch = trafficDataForPatch(values.trafficSplitting, service);
    if (!deleteTraffic || deleteTraffic.percent === 0) {
      return deleteRevisionAction(action);
    }

    return k8sPatch(ServiceModel, service, ksvcPatch)
      .then(() => {
        return deleteRevisionAction(action);
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({ error: errMessage });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(modalProps) => (
        <DeleteRevisionModal
          {...modalProps}
          revisionItems={revisionItems}
          deleteRevision={revision}
          showTraffic={deleteTraffic?.percent > 0}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

type Props = DeleteRevisionModalControllerProps & ModalComponentProps;

const DeleteRevisionModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <DeleteRevisionModalController
        cancel={props.closeOverlay}
        close={props.closeOverlay}
        {...props}
      />
    </ModalWrapper>
  );
};

export const useDeleteRevisionModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(DeleteRevisionModalProvider, props), [launcher, props]);
};
