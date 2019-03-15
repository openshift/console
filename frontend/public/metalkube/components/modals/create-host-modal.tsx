import { CreateBaremetalHostDialog, getResource } from 'kubevirt-web-ui-components';

import { modalResourceLauncher } from '../../../kubevirt/components/utils/modalResourceLauncher';
import { WithResources } from '../../../kubevirt/components/utils/withResources';
import {
  k8sCreate,
  k8sGet,
  k8sPatch,
  k8sKill,
} from '../../../kubevirt/module/okdk8s';
import { units } from '../../../kubevirt/components/utils/okdutils';
import { NamespaceModel } from '../../models';

export const openCreateBaremetalHostModal = activeNamespace => {
  const launcher = modalResourceLauncher(
    CreateBaremetalHostDialog,
    {
      namespaces: {
        resource: getResource(NamespaceModel),
      },
    },
    ({namespaces}) => {
      let selectedNamespace;

      if (namespaces && activeNamespace){
        selectedNamespace = namespaces.find(namespace => namespace.metadata.name === activeNamespace);
      }

      return {
        selectedNamespace,
      };
    }
  );

  launcher({
    k8sCreate,
    k8sGet,
    k8sPatch,
    k8sKill,
    units,
    WithResources,
    createTemplate: false,
  });
};
