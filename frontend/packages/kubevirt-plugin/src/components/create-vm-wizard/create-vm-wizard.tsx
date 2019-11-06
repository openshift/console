import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { createVm, createVmTemplate } from 'kubevirt-web-ui-components';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { TemplateModel } from '@console/internal/models';
import { Firehose, history, units } from '@console/internal/components/utils';
import { k8sGet, TemplateKind } from '@console/internal/module/k8s';
import { Location } from 'history';
import { match as RouterMatch } from 'react-router';
import { withReduxID } from '../../utils/redux/common';
import { VirtualMachineModel } from '../../models';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VolumeType,
} from '../../constants/vm';
import { getResource } from '../../utils';
import { EnhancedK8sMethods } from '../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import { cleanupAndGetResults, getResults } from '../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import {
  concatImmutableLists,
  iGetIn,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../utils/immutable';
import { getTemplateOperatingSystems } from '../../selectors/vm-template/advanced';
import { ResultsWrapper } from '../../k8s/enhancedK8sMethods/types';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import {
  getDefaultSCAccessMode,
  getDefaultSCVolumeMode,
} from '../../selectors/config-map/sc-defaults';
import { getStorageClassConfigMap } from '../../k8s/requests/config-map/storage-class';
import { makeIDReferences } from '../../utils/redux/id-reference';
import { PersistentVolumeClaimWrapper } from '../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import {
  ChangedCommonData,
  CommonData,
  CreateVMWizardComponentProps,
  DetectCommonDataChanges,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
  VMWizardTab,
} from './types';
import { CREATE_VM, CREATE_VM_TEMPLATE, TabTitleResolver, IMPORT_VM } from './strings/strings';
import { vmWizardActions } from './redux/actions';
import { ActionType } from './redux/types';
import { iGetCommonData, iGetCreateVMWizardTabs } from './selectors/immutable/selectors';
import { isStepLocked, isStepPending, isStepValid } from './selectors/immutable/wizard-selectors';
import { ResourceLoadErrors } from './resource-load-errors';
import { CreateVMWizardFooter } from './create-vm-wizard-footer';
import { VMSettingsTab } from './tabs/vm-settings-tab/vm-settings-tab';
import { NetworkingTab } from './tabs/networking-tab/networking-tab';
import { ReviewTab } from './tabs/review-tab/review-tab';
import { ResultTab } from './tabs/result-tab/result-tab';
import { StorageTab } from './tabs/storage-tab/storage-tab';
import { CloudInitTab } from './tabs/cloud-init-tab/cloud-init-tab';

import './create-vm-wizard.scss';

// TODO remove after moving create functions from kubevirt-web-ui-components
/** *
 * kubevirt-web-ui-components InterOP
 */
const kubevirtInterOP = async ({
  activeNamespace,
  vmSettings,
  networks,
  storages,
  templates,
}: {
  activeNamespace: string;
  vmSettings: any;
  networks: VMWizardNetwork[];
  storages: VMWizardStorage[];
  templates: TemplateKind[];
}) => {
  const clonedVMsettings = _.cloneDeep(vmSettings);
  const clonedNetworks = _.cloneDeep(networks);
  const clonedStorages = _.cloneDeep(storages);

  clonedVMsettings.namespace = { value: activeNamespace };
  const operatingSystems = getTemplateOperatingSystems(templates);
  const osField = clonedVMsettings[VMSettingsField.OPERATING_SYSTEM];
  const osID = osField.value;
  osField.value = operatingSystems.find(({ id }) => id === osID);

  const interOPNetworks = clonedNetworks.map(({ networkInterface, network }) => {
    const networkInterfaceWrapper = NetworkInterfaceWrapper.initialize(networkInterface);
    const networkWrapper = NetworkWrapper.initialize(network);

    return {
      name: networkInterfaceWrapper.getName(),
      mac: networkInterfaceWrapper.getMACAddress(),
      binding: networkInterfaceWrapper.getTypeValue(),
      isBootable: networkInterfaceWrapper.isFirstBootableDevice(),
      network: networkWrapper.getReadableName(),
      networkType: networkWrapper.getTypeValue(),
      templateNetwork: {
        network,
        interface: networkInterface,
      },
    };
  });

  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });

  const interOPStorages = clonedStorages.map(
    ({ type, disk, volume, dataVolume, persistentVolumeClaim, importData }) => {
      const diskWrapper = DiskWrapper.initialize(disk);
      const volumeWrapper = VolumeWrapper.initialize(volume);
      const dataVolumeWrapper = dataVolume && DataVolumeWrapper.initialize(dataVolume);
      const persistentVolumeClaimWrapper =
        persistentVolumeClaim && PersistentVolumeClaimWrapper.initialize(persistentVolumeClaim);

      const isImport =
        persistentVolumeClaimWrapper &&
        [
          VMWizardStorageType.V2V_VMWARE_IMPORT,
          VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP,
        ].includes(type);
      const resolveType = () => {
        if (type === VMWizardStorageType.V2V_VMWARE_IMPORT) {
          return 'external-import';
        }
        if (type === VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP) {
          return 'external-v2v-temp';
        }
        return volumeWrapper.getType() === VolumeType.DATA_VOLUME && dataVolume
          ? 'datavolume'
          : undefined;
      };

      if (isImport) {
        return {
          name: diskWrapper.getName(),
          isBootable: diskWrapper.isFirstBootableDevice(),
          storageType: resolveType(),
          size: persistentVolumeClaimWrapper.getSize().value,
          unit: persistentVolumeClaimWrapper.getSize().unit,
          storageClass: persistentVolumeClaimWrapper.getStorageClassName(),
          data: importData,
        };
      }

      return {
        name: diskWrapper.getName(),
        isBootable: diskWrapper.isFirstBootableDevice(),
        storageType: resolveType(),
        templateStorage: {
          volume,
          disk,
          dataVolumeTemplate: dataVolumeWrapper
            ? DataVolumeWrapper.mergeWrappers(
                dataVolumeWrapper,
                DataVolumeWrapper.initializeFromSimpleData({
                  accessModes:
                    dataVolumeWrapper.getAccessModes() ||
                    getDefaultSCAccessMode(
                      storageClassConfigMap,
                      dataVolumeWrapper.getStorageClassName(),
                    ),
                  volumeMode:
                    dataVolumeWrapper.getVolumeMode() ||
                    getDefaultSCVolumeMode(
                      storageClassConfigMap,
                      dataVolumeWrapper.getStorageClassName(),
                    ),
                }),
              ).asResource()
            : undefined,
        },
      };
    },
  );

  return {
    interOPVMSettings: clonedVMsettings,
    interOPNetworks,
    interOPStorages,
  };
};

export class CreateVMWizardComponent extends React.Component<CreateVMWizardComponentProps> {
  private isClosed = false;

  constructor(props) {
    super(props);
    if (!(props[VMWizardProps.isProviderImport] && props[VMWizardProps.isCreateTemplate])) {
      props.onInitialize();
    } else {
      console.error('It is not possible to make an import VM template'); // eslint-disable-line no-console
      this.isClosed = true;
    }
  }

  componentDidUpdate(prevProps) {
    if (this.isClosed) {
      return;
    }
    const changedProps = [...DetectCommonDataChanges].reduce((changedPropsAcc, propName) => {
      if (prevProps[propName] !== this.props[propName]) {
        changedPropsAcc.add(propName);
      }
      return changedPropsAcc;
    }, new Set()) as ChangedCommonData;

    const referencesChanged = !_.isEqual(prevProps.dataIDReferences, this.props.dataIDReferences);

    if (changedProps.size > 0 || referencesChanged) {
      this.props.onCommonDataChanged(
        referencesChanged ? { dataIDReferences: this.props.dataIDReferences } : undefined,
        changedProps,
      );
    }
  }

  componentWillUnmount() {
    this.onClose(true);
  }

  onClose = (disposeOnly?: boolean) => {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    this.props.onClose(disposeOnly);
  };

  getWizardTitle() {
    const { isCreateTemplate, isProviderImport } = this.props;
    if (isCreateTemplate) {
      return CREATE_VM_TEMPLATE;
    }
    if (isProviderImport) {
      return IMPORT_VM;
    }
    return CREATE_VM;
  }

  finish = async () => {
    this.props.onResultsChanged({ errors: [], requestResults: [] }, null, true, true); // reset
    const create = this.props.isCreateTemplate ? createVmTemplate : createVm;

    const enhancedK8sMethods = new EnhancedK8sMethods();
    const vmSettings = iGetIn(this.props.stepData, [VMWizardTab.VM_SETTINGS, 'value']).toJS();
    const networks = immutableListToShallowJS<VMWizardNetwork>(
      iGetIn(this.props.stepData, [VMWizardTab.NETWORKING, 'value']),
    );
    const storages = immutableListToShallowJS(
      iGetIn(this.props.stepData, [VMWizardTab.STORAGE, 'value']),
    );
    const templates = immutableListToShallowJS(
      concatImmutableLists(
        iGetLoadedData(this.props[VMWizardProps.commonTemplates]),
        iGetLoadedData(this.props[VMWizardProps.userTemplates]),
      ),
    );

    const { interOPVMSettings, interOPNetworks, interOPStorages } = await kubevirtInterOP({
      vmSettings,
      networks,
      storages,
      templates,
      activeNamespace: this.props.activeNamespace,
    });

    create(
      enhancedK8sMethods,
      templates,
      interOPVMSettings,
      interOPNetworks,
      interOPStorages,
      [],
      units,
    )
      .then(() => getResults(enhancedK8sMethods))
      .catch((error) => cleanupAndGetResults(enhancedK8sMethods, error))
      .then(({ requestResults, errors, mainError, isValid }: ResultsWrapper) =>
        this.props.onResultsChanged({ mainError, requestResults, errors }, isValid, true, false),
      )
      .catch((e) => console.error(e)); // eslint-disable-line no-console
  };

  render() {
    const { reduxID, stepData } = this.props;

    if (this.isClosed) {
      return null;
    }

    const steps = [
      {
        id: VMWizardTab.VM_SETTINGS,
        component: (
          <>
            <ResourceLoadErrors wizardReduxID={reduxID} />
            <VMSettingsTab wizardReduxID={reduxID} />
          </>
        ),
      },
      {
        id: VMWizardTab.NETWORKING,
        component: (
          <>
            <ResourceLoadErrors wizardReduxID={reduxID} />
            <NetworkingTab wizardReduxID={reduxID} />
          </>
        ),
      },
      {
        id: VMWizardTab.STORAGE,
        component: (
          <>
            <ResourceLoadErrors wizardReduxID={reduxID} />
            <StorageTab wizardReduxID={reduxID} />
          </>
        ),
      },
      {
        name: 'Advanced',
        steps: [
          {
            id: VMWizardTab.ADVANCED_CLOUD_INIT,
            component: (
              <>
                <ResourceLoadErrors wizardReduxID={reduxID} />
                <CloudInitTab wizardReduxID={reduxID} />
              </>
            ),
          },
        ],
      },
      {
        id: VMWizardTab.REVIEW,
        component: <ReviewTab wizardReduxID={reduxID} />,
      },
      {
        id: VMWizardTab.RESULT,
        component: <ResultTab wizardReduxID={reduxID} />,
        isFinishedStep:
          isStepPending(stepData, VMWizardTab.RESULT) || isStepValid(stepData, VMWizardTab.RESULT),
      },
    ];

    const isLocked = _.some(steps, ({ id }) => isStepLocked(stepData, id));

    const calculateSteps = (initialSteps, initialAccumulator: WizardStep[] = []): WizardStep[] =>
      initialSteps.reduce((stepAcc: WizardStep[], step: any) => {
        const isFirstStep = _.isEmpty(stepAcc);
        let innerSteps;
        if (step.steps) {
          // pass reference to last step but remove it afterwards
          innerSteps = calculateSteps(step.steps, isFirstStep ? [] : [_.last(stepAcc)]);
          if (!isFirstStep) {
            innerSteps.shift();
          }
        }
        let prevStep;
        if (!isFirstStep) {
          prevStep = _.last<WizardStep>(stepAcc);
          while (prevStep.steps) {
            prevStep = _.last(prevStep.steps);
          }
        }
        const isPrevStepValid = isFirstStep || isStepValid(stepData, prevStep.id as VMWizardTab);
        const canJumpToPrevStep = isFirstStep || prevStep.canJumpTo;

        const calculatedStep = {
          ...step,
          name: TabTitleResolver[step.id] || step.name,
          canJumpTo: isStepLocked(stepData, VMWizardTab.RESULT) // request finished
            ? step.id === VMWizardTab.RESULT
            : !isLocked && isPrevStepValid && canJumpToPrevStep && step.id !== VMWizardTab.RESULT,
          component: step.component,
        };

        if (innerSteps) {
          calculatedStep.steps = innerSteps;
        }

        stepAcc.push(calculatedStep);
        return stepAcc;
      }, initialAccumulator);

    return (
      <div className="kubevirt-create-vm-modal__container">
        {!isStepValid(stepData, VMWizardTab.RESULT) && (
          <div className="yaml-editor__header">
            <h1 className="yaml-editor__header-text">{this.getWizardTitle()}</h1>
          </div>
        )}
        <Wizard
          isInPage
          className="kubevirt-create-vm-modal__wizard-content"
          onClose={this.onClose}
          onNext={({ id }) => {
            if (id === VMWizardTab.RESULT) {
              this.finish();
            }
          }}
          steps={calculateSteps(steps)}
          footer={<CreateVMWizardFooter wizardReduxID={reduxID} />}
        />
      </div>
    );
  }
}

const wizardStateToProps = (state, { reduxID }) => ({
  stepData: iGetCreateVMWizardTabs(state, reduxID),
  // fetch data from store to detect and fire changes
  ...[...DetectCommonDataChanges].reduce((acc, propName) => {
    acc[propName] = iGetCommonData(state, reduxID, propName);
    return acc;
  }, {}),
});

const wizardDispatchToProps = (dispatch, props) => ({
  onInitialize: () => {
    dispatch(
      vmWizardActions[ActionType.Create](props.reduxID, {
        data: {
          isCreateTemplate: props.isCreateTemplate,
          isProviderImport: props.isProviderImport,
        },
        dataIDReferences: props.dataIDReferences,
      }),
    );
  },
  onCommonDataChanged: (commonData: CommonData, changedCommonData: ChangedCommonData) => {
    dispatch(
      vmWizardActions[ActionType.UpdateCommonData](props.reduxID, commonData, changedCommonData),
    );
  },
  onResultsChanged: (results, isValid, isLocked, isPending) => {
    dispatch(
      vmWizardActions[ActionType.SetResults](props.reduxID, results, isValid, isLocked, isPending),
    );
  },
  onClose: (disposeOnly: boolean) => {
    dispatch(vmWizardActions[ActionType.Dispose](props.reduxID, props));
    if (!disposeOnly && props.onClose) {
      props.onClose();
    }
  },
});

export const CreateVMWizard = connect(
  wizardStateToProps,
  wizardDispatchToProps,
)(CreateVMWizardComponent);

export const CreateVMWizardPageComponent: React.FC<CreateVMWizardPageComponentProps> = ({
  reduxID,
  match,
  location,
}) => {
  const activeNamespace = match && match.params && match.params.ns;
  const path = (match && match.path) || '';
  const search = location && location.search;
  const resources = [
    getResource(VirtualMachineModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.virtualMachines,
    }),
    getResource(TemplateModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.userTemplates,
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    }),
    getResource(TemplateModel, {
      namespace: 'openshift',
      prop: VMWizardProps.commonTemplates,
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    }),
  ];

  const dataIDReferences = makeIDReferences(resources);

  dataIDReferences[VMWizardProps.activeNamespace] = ['UI', 'activeNamespace'];

  return (
    <Firehose resources={resources}>
      <CreateVMWizard
        isCreateTemplate={!path.includes('/virtualmachines/')}
        isProviderImport={new URLSearchParams(search).get('mode') === 'import'}
        dataIDReferences={dataIDReferences}
        activeNamespace={activeNamespace}
        reduxID={reduxID}
        onClose={() => history.goBack()}
      />
    </Firehose>
  );
};

type CreateVMWizardPageComponentProps = {
  reduxID?: string;
  location?: Location;
  match?: RouterMatch<{ ns: string; plural: string; appName?: string }>;
};

export const CreateVMWizardPage = withReduxID(CreateVMWizardPageComponent);
