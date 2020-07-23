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
import { CEPH_STORAGE_NAMESPACE } from '../../../constants';

const OSD_REMOVAL_TEMPLATE = 'ocs-osd-removal';

const createTemplateSecret = async (template: TemplateKind, osdId: string) => {
  const parametersSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: `${OSD_REMOVAL_TEMPLATE}-parameters`,
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
      name: `${OSD_REMOVAL_TEMPLATE}-template-instance`,
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
  const { diskName, osdId, cancel, close } = props;

  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setProgress(true);
    /*
     * TODO:(Afreen) Add validations based on ocs status (part of followup PR)
     */
    try {
      instantiateTemplate(osdId);
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
  osdId: string;
} & ModalComponentProps;
