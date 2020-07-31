import * as React from 'react';
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
import { CEPH_STORAGE_NAMESPACE, OSD_REMOVAL_TEMPLATE } from '../../../constants';
import { OCSDiskList, OCSColumnStateAction, ActionType, Status } from './state-reducer';

const createTemplateSecret = async (template: TemplateKind, osdId: string) => {
  const parametersSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: `${OSD_REMOVAL_TEMPLATE}-${osdId}`,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    stringData: {
      [template.parameters[0].name]: osdId,
    },
  };
  return k8sCreate(SecretModel, parametersSecret);
};

const createTemplateInstance = async (parametersSecret: SecretKind, template: TemplateKind) => {
  const templateInstance: TemplateInstanceKind = {
    apiVersion: apiVersionForModel(TemplateInstanceModel),
    kind: TemplateInstanceModel.kind,
    metadata: {
      name: parametersSecret.metadata.name,
      namespace: CEPH_STORAGE_NAMESPACE,
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

const instantiateTemplate = async (osdId: string) => {
  const osdRemovalTemplate = await k8sGet(
    TemplateModel,
    OSD_REMOVAL_TEMPLATE,
    CEPH_STORAGE_NAMESPACE,
  );
  const templateSecret = await createTemplateSecret(osdRemovalTemplate, osdId);
  await createTemplateInstance(templateSecret, osdRemovalTemplate);
};

const DiskReplacementAction = (props: DiskReplacementActionProps) => {
  const { diskName, diskOsdMap, isRebalancing, dispatch, cancel, close } = props;

  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setProgress(true);
    try {
      const { status, osd } = diskOsdMap[diskName];
      if (isRebalancing && status !== Status.Offline)
        throw new Error('Replacement not allowed. Rebalancing is in progress');
      if (status === Status.Offline || status === Status.NotResponding) {
        instantiateTemplate(osd);
        dispatch({
          type: ActionType.SET_REPLACEMENT_MAP,
          payload: { [diskName]: { osd, status: Status.PreparingToReplace } },
        });
      } else {
        throw new Error('Replacement not allowed');
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
  diskOsdMap: OCSDiskList;
  isRebalancing: boolean;
  dispatch: React.Dispatch<OCSColumnStateAction>;
} & ModalComponentProps;
