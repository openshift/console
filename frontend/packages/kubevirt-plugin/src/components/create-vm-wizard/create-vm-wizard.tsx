import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { createVm, createVmTemplate } from 'kubevirt-web-ui-components';
import { Wizard } from '@patternfly/react-core';
import {
  PersistentVolumeClaimModel,
  StorageClassModel,
  TemplateModel,
} from '@console/internal/models';
import {
  Firehose,
  history,
  makeQuery,
  makeReduxID,
  units,
} from '@console/internal/components/utils';
import { withReduxID } from '../../utils/redux/common';
import {
  DataVolumeModel,
  NetworkAttachmentDefinitionModel,
  VirtualMachineModel,
} from '../../models';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../constants/vm';
import { getResource } from '../../utils';
import { EnhancedK8sMethods } from '../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import {
  cleanupAndGetResults,
  errorsFirstSort,
  getResults,
} from '../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import {
  concatImmutableLists,
  iGetIn,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../utils/immutable';
import { getTemplateOperatingSystems } from '../../selectors/vm-template/advanced';
import {
  ChangedCommonData,
  CommonData,
  CreateVMWizardComponentProps,
  DetectCommonDataChanges,
  VMSettingsField,
  VMWizardProps,
  VMWizardTab,
} from './types';
import { CREATE_VM, CREATE_VM_TEMPLATE, TabTitleResolver } from './strings/strings';
import { vmWizardActions } from './redux/actions';
import { ActionType } from './redux/types';
import { iGetCommonData, iGetCreateVMWizardTabs } from './selectors/immutable/selectors';
import { isStepLocked, isStepValid } from './selectors/immutable/wizard-selectors';
import { VMSettingsTab } from './tabs/vm-settings-tab/vm-settings-tab';
import { ResourceLoadErrors } from './resource-load-errors';
import { CreateVMWizardFooter } from './create-vm-wizard-footer';

import './create-vm-wizard.scss';

export class CreateVMWizardComponent extends React.Component<CreateVMWizardComponentProps> {
  private isClosed = false;

  constructor(props) {
    super(props);
    props.onInitialize();
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

    if (changedProps.size > 0) {
      this.props.onCommonDataChanged(
        { dataIDReferences: this.props.dataIDReferences },
        changedProps,
      );
    }
  }

  onClose = () => {
    this.isClosed = true;
    this.props.onClose();
  };

  finish() {
    this.props.lockTab(VMWizardTab.RESULT);
    const create = this.props.isCreateTemplate ? createVmTemplate : createVm;

    const enhancedK8sMethods = new EnhancedK8sMethods();
    const vmSettings = iGetIn(this.props.stepData, [VMWizardTab.VM_SETTINGS, 'value']).toJS();
    const templates = immutableListToShallowJS(
      concatImmutableLists(
        iGetLoadedData(this.props[VMWizardProps.commonTemplates]),
        iGetLoadedData(this.props[VMWizardProps.userTemplates]),
      ),
    );

    // TODO remove after moving create functions from kubevirt-web-ui-components
    /** *
     * BEGIN kubevirt-web-ui-components InterOP
     */
    vmSettings.namespace = { value: this.props.activeNamespace };
    const operatingSystems = getTemplateOperatingSystems(templates);
    const osField = vmSettings[VMSettingsField.OPERATING_SYSTEM];
    const osID = osField.value;
    osField.value = operatingSystems.find(({ id }) => id === osID);
    /**
     * END kubevirt-web-ui-components InterOP
     */

    create(
      enhancedK8sMethods,
      templates,
      vmSettings,
      iGetIn(this.props.stepData, [VMWizardTab.NETWORKS, 'value']).toJS(),
      iGetIn(this.props.stepData, [VMWizardTab.STORAGE, 'value']).toJS(),
      immutableListToShallowJS(iGetLoadedData(this.props[VMWizardProps.persistentVolumeClaims])),
      units,
    )
      .then(() => getResults(enhancedK8sMethods))
      .catch((error) => cleanupAndGetResults(enhancedK8sMethods, error))
      .then(({ results, isValid }) =>
        this.props.onResultsChanged(errorsFirstSort(results), isValid),
      ) // TODO should distinguish between errors and objects in redux
      .catch((e) => console.error(e)); // eslint-disable-line no-console
  }

  render() {
    const { isCreateTemplate, reduxID, stepData } = this.props;
    const createVMText = isCreateTemplate ? CREATE_VM_TEMPLATE : CREATE_VM;

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
      // {
      //   id: VMWizardTab.NETWORKS,
      // },
      // {
      //   id: VMWizardTab.STORAGE,
      // },
      {
        id: VMWizardTab.REVIEW,
        component: <>VM review</>,
      },
      {
        id: VMWizardTab.RESULT,
        component: (
          <>
            {isStepValid(stepData, VMWizardTab.RESULT) ? 'Created Successfully' : 'Creation Failed'}
          </>
        ),
        isFinishedStep: isStepValid(stepData, VMWizardTab.RESULT),
      },
    ];

    const isLocked = _.some(steps, ({ id }) => isStepLocked(stepData, id));

    return (
      <div className="kubevirt-create-vm-modal__container">
        {!isStepValid(stepData, VMWizardTab.RESULT) && (
          <div className="yaml-editor__header">
            <h1 className="yaml-editor__header-text">{createVMText}</h1>
          </div>
        )}
        <Wizard
          isInPage
          className="kubevirt-create-vm-modal__wizard-content"
          title={createVMText}
          onClose={this.onClose}
          onNext={({ id }) => {
            if (id === VMWizardTab.RESULT) {
              this.finish();
            }
          }}
          steps={steps.reduce((stepAcc, step, idx) => {
            const prevStep = stepAcc[idx - 1];
            const isPrevStepValid = idx === 0 ? true : isStepValid(stepData, prevStep.id);
            const canJumpToPrevStep = idx === 0 ? true : prevStep.canJumpTo;

            stepAcc.push({
              ...step,
              name: TabTitleResolver[step.id],
              canJumpTo: isStepLocked(stepData, VMWizardTab.RESULT) // request finished
                ? step.id === VMWizardTab.RESULT
                : !isLocked &&
                  isPrevStepValid &&
                  canJumpToPrevStep &&
                  step.id !== VMWizardTab.RESULT,
              component: step.component,
            });
            return stepAcc;
          }, [])}
          footer={<CreateVMWizardFooter createVMText={createVMText} wizardReduxId={reduxID} />}
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
        },
        dataIDReferences: props.dataIDReferences,
      }),
    );
  },
  lockTab: (tabID) => {
    dispatch(vmWizardActions[ActionType.SetTabLocked](props.reduxId, tabID, true));
  },
  onCommonDataChanged: (commonData: CommonData, changedCommonData: ChangedCommonData) => {
    dispatch(
      vmWizardActions[ActionType.UpdateCommonData](props.reduxID, commonData, changedCommonData),
    );
  },
  onResultsChanged: (results, isValid) => {
    dispatch(vmWizardActions[ActionType.SetResults](props.reduxID, results, isValid));
  },
  onClose: () => {
    if (props.onClose) {
      props.onClose();
    }
    dispatch(vmWizardActions[ActionType.Dispose](props.reduxID, props));
  },
});

export const CreateVMWizard = connect(
  wizardStateToProps,
  wizardDispatchToProps,
)(CreateVMWizardComponent);

export const CreateVMWizardPageComponent: React.FC<CreateVMWizardPageComponentProps> = (props) => {
  const {
    reduxID,
    match: {
      params: { ns: activeNamespace },
    },
  } = props;
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
    getResource(NetworkAttachmentDefinitionModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.networkConfigs,
    }),
    getResource(StorageClassModel, { prop: VMWizardProps.storageClasses }),
    getResource(PersistentVolumeClaimModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.persistentVolumeClaims,
    }),
    getResource(DataVolumeModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.dataVolumes,
    }),
  ];

  const dataIDReferences = resources.reduce((acc, resource) => {
    const query = makeQuery(
      resource.namespace,
      resource.selector,
      resource.fieldSelector,
      resource.name,
    );
    acc[resource.prop] = ['k8s', makeReduxID(resource.model, query)];

    return acc;
  }, {});

  dataIDReferences[VMWizardProps.activeNamespace] = ['UI', 'activeNamespace'];

  return (
    <Firehose resources={resources}>
      <CreateVMWizard
        isCreateTemplate={!props.match.path.includes('/virtualmachines/')}
        dataIDReferences={dataIDReferences}
        activeNamespace={activeNamespace}
        reduxID={reduxID}
        onClose={() => history.goBack()}
      />
    </Firehose>
  );
};

type CreateVMWizardPageComponentProps = {
  match: {
    params: {
      ns: string;
    };
    path: string;
    isExact: boolean;
    url: string;
  };
  reduxID: string;
};

export const CreateVMWizardPage = withReduxID(CreateVMWizardPageComponent);
