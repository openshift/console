import * as _ from 'lodash';
import { connect } from 'react-redux';
import {
  CreateVmWizard,
  getResource,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  TEMPLATE_TYPE_BASE,
} from 'kubevirt-web-ui-components';
import {
  NamespaceModel,
  TemplateModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
} from '@console/internal/models';
import { getName } from '@console/shared';
import { units, Firehose } from '@console/internal/components/utils';
import { k8sCreate, k8sGet, k8sPatch, k8sKill } from '@console/internal/module/k8s';
import {
  VirtualMachineModel,
  NetworkAttachmentDefinitionModel,
  DataVolumeModel,
  V2VVMwareModel,
} from '../../models';
import { createModalResourceLauncher } from './modal-resource-launcher';

const mapStateToProps = ({ k8s }) => {
  const kindsInFlight = k8s.getIn(['RESOURCES', 'inFlight']);
  const k8sModels = k8s.getIn(['RESOURCES', 'models']);

  return { isV2vVmwareCrd: !kindsInFlight && !!k8sModels.get(V2VVMwareModel.kind) };
};

const CreateVmWizardDecorated = connect(mapStateToProps)(CreateVmWizard);

export const openCreateVmWizard = (activeNamespace, createTemplate = false) => {
  const resources = [
    getResource(NamespaceModel, { prop: 'namespaces', optional: true }),
    getResource(VirtualMachineModel, { prop: 'virtualMachines' }),
    getResource(TemplateModel, {
      namespace: activeNamespace,
      prop: 'userTemplates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    }),
    getResource(TemplateModel, {
      namespace: 'openshift',
      prop: 'commonTemplates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    }),
    getResource(NetworkAttachmentDefinitionModel, {
      namespace: activeNamespace,
      prop: 'networkConfigs',
    }),
    getResource(StorageClassModel, { prop: 'storageClasses' }),
    getResource(PersistentVolumeClaimModel, {
      namespace: activeNamespace,
      prop: 'persistentVolumeClaims',
    }),
    getResource(DataVolumeModel, { namespace: activeNamespace, prop: 'dataVolumes' }),
  ];

  const resourcesToProps = (props) => {
    const { namespaces, userTemplates, commonTemplates } = props;
    const flatten = (resourceName) => ({ [resourceName]: _.get(props[resourceName], 'data') });

    let selectedNamespace;
    if (activeNamespace) {
      selectedNamespace = _.get(namespaces, 'data', []).find(
        (namespace) => getName(namespace) === activeNamespace,
      );
    }

    let templates;
    if (userTemplates && commonTemplates) {
      templates = _.get(userTemplates, 'data', []).concat(_.get(commonTemplates, 'data', []));
    }

    return {
      selectedNamespace,
      templates,
      templatesLoaded:
        userTemplates && commonTemplates && userTemplates.loaded && commonTemplates.loaded,
      ...flatten('namespaces'),
      ...flatten('virtualMachines'),
      ...flatten('userTemplates'),
      ...flatten('commonTemplates'),
      ...flatten('networkConfigs'),
      ...flatten('storageClasses'),
      ...flatten('persistentVolumeClaims'),
      ...flatten('dataVolumes'),
    };
  };

  const launcher = createModalResourceLauncher(
    CreateVmWizardDecorated,
    resources,
    resourcesToProps,
  );

  // TODO(mlibra): The CreateVmWizard will be refactored later when being moved from web-ui-components to openshift/console, so following props will not be needed. So far we need to meet contract to keep backward compatibility.
  launcher({
    k8sCreate,
    k8sGet,
    k8sPatch,
    k8sKill,
    units,
    Firehose,
    createTemplate,
  });
};
