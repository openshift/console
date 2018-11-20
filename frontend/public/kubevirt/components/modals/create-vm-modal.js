import { resourceLauncher } from '../utils/resourceLauncher';
import { CreateVmWizard, TEMPLATE_TYPE_LABEL } from 'kubevirt-web-ui-components';
import { k8sCreate } from '../../module/okdk8s';
import {
  NamespaceModel,
  TemplateModel,
  NetworkAttachmentDefinitionModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
} from '../../models';
import { getResourceKind } from '../utils/resources';
import { units } from '../utils/okdutils';

export const openCreateVmWizard = ( activeNamespace, createTemplate = false ) => {
  const launcher = resourceLauncher(CreateVmWizard, {
    namespaces: {
      resource: getResourceKind(NamespaceModel, undefined, true, undefined, true),
    },
    templates: {
      resource: getResourceKind(TemplateModel, undefined, true, undefined, true, undefined, [{key: TEMPLATE_TYPE_LABEL, operator: 'Exists' }]),
    },
    networkConfigs: {
      resource: getResourceKind(NetworkAttachmentDefinitionModel, undefined, true, undefined, true),
    },
    storageClasses: {
      resource: { kind:StorageClassModel.kind, isList: true, prop: StorageClassModel.kind},
    },
    persistentVolumeClaims: {
      resource: { kind:PersistentVolumeClaimModel.kind, isList: true, prop: PersistentVolumeClaimModel.kind},
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
