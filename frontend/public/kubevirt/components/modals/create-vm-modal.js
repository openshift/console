import { modalResourceLauncher } from '../utils/modalResourceLauncher';
import { CreateVmWizard, TEMPLATE_TYPE_LABEL, getResource } from 'kubevirt-web-ui-components';
import { k8sCreate } from '../../module/okdk8s';
import {
  NamespaceModel,
  TemplateModel,
  NetworkAttachmentDefinitionModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
} from '../../models';
import { units } from '../utils/okdutils';

export const openCreateVmWizard = ( activeNamespace, createTemplate = false ) => {
  const launcher = modalResourceLauncher(CreateVmWizard, {
    namespaces: {
      resource: getResource(NamespaceModel),
    },
    templates: {
      resource: getResource(TemplateModel, {matchExpressions: [{key: TEMPLATE_TYPE_LABEL, operator: 'Exists' }]}),
    },
    networkConfigs: {
      resource: getResource(NetworkAttachmentDefinitionModel),
    },
    storageClasses: {
      resource:  getResource(StorageClassModel),
    },
    persistentVolumeClaims: {
      resource:  getResource(PersistentVolumeClaimModel),
    },
  },(({namespaces}) => {
      let selectedNamespace;

      if (namespaces && activeNamespace){
        selectedNamespace = namespaces.find(namespace => namespace.metadata.name === activeNamespace);
      }

      return {
        selectedNamespace,
      };
    }));

  launcher({
    k8sCreate,
    units,
    createTemplate,
  });

};
