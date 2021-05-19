import * as React from 'react';
import { Formik, FormikHelpers, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  k8sKill,
  K8sResourceKind,
  k8sUpdate,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  Firehose,
  FirehoseResult,
  history,
  resourceListPathFromModel,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { KNATIVE_SERVING_LABEL } from '../../const';
import { RevisionModel, ServiceModel } from '../../models';
import {
  knativeServingResourcesTrafficSplitting,
  getRevisionItems,
  constructObjForUpdate,
} from '../../utils/traffic-splitting-utils';
import { getKnativeRevisionsData } from '../../topology/knative-topology-utils';
import { TrafficSplittingType } from '../traffic-splitting/TrafficSplitting';
import DeleteRevisionModal from './DeleteRevisionModal';
import { Traffic } from '../../types';

type ControllerProps = {
  loaded?: boolean;
  revision?: K8sResourceKind;
  resources?: {
    configurations: FirehoseResult;
    revisions: FirehoseResult;
    services: FirehoseResult;
  };
  cancel?: () => void;
  close?: () => void;
};

const Controller: React.FC<ControllerProps> = ({ loaded, resources, revision, cancel, close }) => {
  const { t } = useTranslation();
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
          <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
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

  const deleteRevision = (action: FormikHelpers<FormikValues>) => {
    return k8sKill(RevisionModel, revision)
      .then(() => {
        close();
        // If we are currently on the deleted revision's page, redirect to the list page
        const re = new RegExp(`/${revision.metadata.name}(/|$)`);
        if (re.test(window.location.pathname)) {
          history.push(resourceListPathFromModel(RevisionModel, revision.metadata.namespace));
        }
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({ error: errMessage });
      });
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const obj = constructObjForUpdate(values.trafficSplitting, service);
    if (!deleteTraffic || deleteTraffic.percent === 0) {
      return deleteRevision(action);
    }

    return k8sUpdate(ServiceModel, obj)
      .then(() => {
        deleteRevision(action);
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

type DeleteRevisionModalControllerProps = {
  revision: K8sResourceKind;
};

const DeleteRevisionModalController: React.FC<DeleteRevisionModalControllerProps> = (props) => {
  const {
    metadata: { namespace },
  } = props.revision;
  const resources = knativeServingResourcesTrafficSplitting(namespace);
  resources.push({
    isList: true,
    kind: referenceForModel(ServiceModel),
    namespace,
    prop: 'services',
  });

  return (
    <Firehose resources={resources}>
      <Controller {...props} />
    </Firehose>
  );
};

type Props = DeleteRevisionModalControllerProps & ModalComponentProps;

export const deleteRevisionModalLauncher = createModalLauncher<Props>(
  DeleteRevisionModalController,
);
