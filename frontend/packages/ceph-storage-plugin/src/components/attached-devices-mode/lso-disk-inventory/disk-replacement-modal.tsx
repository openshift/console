import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory';
import {
  k8sGet,
  k8sCreate,
  TemplateKind,
  TemplateInstanceKind,
  apiVersionForModel,
  SecretKind,
} from '@console/internal/module/k8s';
import { TemplateModel, TemplateInstanceModel, SecretModel } from '@console/internal/models';
import { CEPH_STORAGE_NAMESPACE, OSD_REMOVAL_TEMPLATE, DASHBOARD_LINK } from '../../../constants';
import { OCSDiskList, OCSColumnStateAction, ActionType, Status } from './state-reducer';

const createTemplateSecret = async (template: TemplateKind, osdId: string) => {
  const parametersSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      generateName: `${OSD_REMOVAL_TEMPLATE}-${osdId}-`,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    stringData: {
      [template.parameters[0].name]: osdId,
    },
  };
  return k8sCreate(SecretModel, parametersSecret);
};

const createTemplateInstance = async (
  parametersSecret: SecretKind,
  template: TemplateKind,
  osd: string,
  disk: string,
) => {
  const templateInstance: TemplateInstanceKind = {
    apiVersion: apiVersionForModel(TemplateInstanceModel),
    kind: TemplateInstanceModel.kind,
    metadata: {
      generateName: `${OSD_REMOVAL_TEMPLATE}-${osd}-`,
      namespace: CEPH_STORAGE_NAMESPACE,
      annotations: {
        disk,
        osd,
      },
    },
    spec: {
      secret: {
        name: parametersSecret.metadata.name,
      },
      template,
    },
  };
  return k8sCreate(TemplateInstanceModel, templateInstance);
};

const instantiateTemplate = async (osdId: string, diskName: string) => {
  const osdRemovalTemplate = await k8sGet(
    TemplateModel,
    OSD_REMOVAL_TEMPLATE,
    CEPH_STORAGE_NAMESPACE,
  );
  const templateSecret = await createTemplateSecret(osdRemovalTemplate, osdId);
  await createTemplateInstance(templateSecret, osdRemovalTemplate, osdId, diskName);
};

const DiskReplacementAction = (props: DiskReplacementActionProps) => {
  const { diskName, alertsMap, replacementMap, isRebalancing, dispatch, cancel, close } = props;

  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setProgress(true);
    try {
      const { osd } = alertsMap[diskName];
      const replacementStatus = replacementMap[diskName]?.status;
      if (
        replacementStatus === Status.PreparingToReplace ||
        replacementStatus === Status.ReplacementReady
      )
        throw new Error(`replacement disallowed: disk "${diskName}" is "${replacementStatus}"`);
      else {
        instantiateTemplate(osd, diskName);
        dispatch({
          type: ActionType.SET_REPLACEMENT_MAP,
          payload: { [diskName]: { osd, status: Status.PreparingToReplace } },
        });
      }
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} name="form" className="modal-content">
      <ModalTitle>Disk Replacement</ModalTitle>
      <ModalBody>
        <p>This action will start preparing the disk for replacement.</p>
        {isRebalancing && alertsMap[diskName].status !== Status.Offline && (
          <Alert
            variant="info"
            className="co-alert"
            title="Data rebalancing is in progress"
            isInline
          >
            <Link onClick={close} to={DASHBOARD_LINK}>
              See data resiliency status
            </Link>
          </Alert>
        )}
        <p>
          Are you sure you want to replace <strong>{diskName}</strong> ?
        </p>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Replace"
        cancel={cancel}
      />
    </form>
  );
};

export const diskReplacementModal = createModalLauncher(DiskReplacementAction);

export type DiskReplacementActionProps = {
  diskName: string;
  isRebalancing: boolean;
  alertsMap: OCSDiskList;
  replacementMap: OCSDiskList;
  dispatch: React.Dispatch<OCSColumnStateAction>;
} & ModalComponentProps;
