import * as React from 'react';
import { Formik, FormikHelpers, FormikValues } from 'formik';
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
  transformTrafficSplittingData,
  knativeServingResourcesTrafficSplitting,
  getRevisionItems,
  constructObjForUpdate,
} from '../../utils/traffic-splitting-utils';
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
  if (!loaded) {
    return null;
  }
  const service = resources.services.data.find((s: K8sResourceKind) => {
    return revision.metadata.labels[KNATIVE_SERVING_LABEL] === s.metadata.name;
  });

  const revisions = transformTrafficSplittingData(service, resources).filter(
    (r) => revision.metadata.uid !== r.metadata.uid,
  );

  if (revisions.length === 0) {
    return (
      <form className="modal-content" onSubmit={close}>
        <ModalTitle>
          <RedExclamationCircleIcon className="co-icon-space-r" />
          Unable to delete {RevisionModel.label}
        </ModalTitle>
        <ModalBody>
          <p>
            You cannot delete the last {RevisionModel.label} for the {ServiceModel.label}.
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
              OK
            </Button>
          </ActionGroup>
        </ModalFooter>
      </form>
    );
  }

  const revisionItems = getRevisionItems(revisions);

  const traffic = service?.spec?.traffic ?? [{ percent: 0, tag: '', revisionName: '' }];
  const deleteTraffic = traffic.find((t) => t.revisionName === revision.metadata.name);

  const initialValues: TrafficSplittingType = {
    trafficSplitting: traffic.reduce((acc: Traffic[], t) => {
      if (!t.revisionName || revisions.find((r) => r.metadata.name === t.revisionName)) {
        const trafficIndex = acc.findIndex((val) => val.revisionName === t.revisionName);
        if (trafficIndex >= 0) {
          acc[trafficIndex].percent += t.percent;
        } else {
          acc.push({
            percent: t.percent,
            tag: t.tag || '',
            revisionName: t.revisionName || '',
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
    k8sKill(RevisionModel, revision)
      .then(() => {
        close();
        // If we are currently on the deleted revision's page, redirect to the list page
        const re = new RegExp(`/${revision.metadata.name}(/|$)`);
        if (re.test(window.location.pathname)) {
          history.push(resourceListPathFromModel(RevisionModel, revision.metadata.namespace));
        }
      })
      .catch((err) => {
        action.setStatus({ error: err.message || 'An error occurred. Please try again' });
      });
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const obj = constructObjForUpdate(values.trafficSplitting, service);
    if (!deleteTraffic || deleteTraffic.percent === 0) {
      deleteRevision(action);
      return;
    }

    k8sUpdate(ServiceModel, obj)
      .then(() => {
        deleteRevision(action);
      })
      .catch((err) => {
        action.setStatus({ error: err.message || 'An error occurred. Please try again' });
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
