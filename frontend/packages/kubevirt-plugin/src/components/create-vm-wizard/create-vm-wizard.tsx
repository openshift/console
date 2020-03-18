import * as React from 'react';
import * as _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { FLAGS } from '@console/shared';
import {
  connectToFlags,
  featureReducerName,
  FlagsObject,
} from '@console/internal/reducers/features';
import { TemplateModel } from '@console/internal/models';
import { Firehose, FirehoseResource, history } from '@console/internal/components/utils';
import { Location } from 'history';
import { match as RouterMatch } from 'react-router';
import { withReduxID } from '../../utils/redux/common';
import { DataVolumeModel, VirtualMachineModel } from '../../models';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VMWizardMode,
  VMWizardView,
} from '../../constants/vm';
import { getResource } from '../../utils';
import { EnhancedK8sMethods } from '../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import { cleanupAndGetResults, getResults } from '../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { iGetIn, iGetLoadedData, immutableListToJS } from '../../utils/immutable';
import { ResultsWrapper } from '../../k8s/enhancedK8sMethods/types';
import { makeIDReferences } from '../../utils/redux/id-reference';
import { createVM, createVMTemplate } from '../../k8s/requests/vm/create/create';
import {
  ChangedCommonData,
  CommonData,
  CreateVMWizardComponentProps,
  DetectCommonDataChanges,
  VMWizardNetwork,
  VMWizardProps,
  VMWizardStorage,
  VMWizardTab,
} from './types';
import { CREATE_VM, CREATE_VM_TEMPLATE, IMPORT_VM, TabTitleResolver } from './strings/strings';
import { vmWizardActions } from './redux/actions';
import { ActionType } from './redux/types';
import { getResultInitialState } from './redux/initial-state/result-tab-initial-state';
import {
  iGetCommonData,
  iGetCreateVMWizardTabs,
  iGetExtraWSQueries,
} from './selectors/immutable/selectors';
import {
  isLastStepErrorFatal,
  isStepHidden,
  isStepLocked,
  isStepPending,
  isStepValid,
} from './selectors/immutable/wizard-selectors';
import { ResourceLoadErrors } from './resource-load-errors';
import { CreateVMWizardFooter } from './create-vm-wizard-footer';
import { ImportProvidersTab } from './tabs/import-providers-tab/import-providers-tab';
import { VMSettingsTab } from './tabs/vm-settings-tab/vm-settings-tab';
import { NetworkingTab } from './tabs/networking-tab/networking-tab';
import { ReviewTab } from './tabs/review-tab/review-tab';
import { ResultTab } from './tabs/result-tab/result-tab';
import { StorageTab } from './tabs/storage-tab/storage-tab';
import { CloudInitTab } from './tabs/cloud-init-tab/cloud-init-tab';
import { VirtualHardwareTab } from './tabs/virtual-hardware-tab/virtual-hardware-tab';
import { useStorageClassConfigMapWrapped } from '../../hooks/storage-class-config-map';

import './create-vm-wizard.scss';

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
      let commonDataUpdate: CommonData = referencesChanged
        ? { dataIDReferences: this.props.dataIDReferences }
        : undefined;
      if (changedProps.has(VMWizardProps.storageClassConfigMap)) {
        commonDataUpdate = {
          ...commonDataUpdate,
          data: {
            [VMWizardProps.storageClassConfigMap]: this.props[VMWizardProps.storageClassConfigMap],
          },
        };
      }
      this.props.onCommonDataChanged(commonDataUpdate, changedProps);
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
    const { isCreateTemplate, activeNamespace, isProviderImport, openshiftFlag } = this.props;

    const enhancedK8sMethods = new EnhancedK8sMethods();
    const importProviders = iGetIn(this.props.stepData, [
      VMWizardTab.IMPORT_PROVIDERS,
      'value',
    ]).toJS();
    const vmSettings = iGetIn(this.props.stepData, [VMWizardTab.VM_SETTINGS, 'value']).toJS();
    const networks = immutableListToJS<VMWizardNetwork>(
      iGetIn(this.props.stepData, [VMWizardTab.NETWORKING, 'value']),
    );
    const storages = immutableListToJS<VMWizardStorage>(
      iGetIn(this.props.stepData, [VMWizardTab.STORAGE, 'value']),
    );

    const iUserTemplates = iGetLoadedData(this.props[VMWizardProps.userTemplates]);
    const iCommonTemplates = iGetLoadedData(this.props[VMWizardProps.commonTemplates]);

    const create = isCreateTemplate ? createVMTemplate : createVM;
    create({
      enhancedK8sMethods,
      importProviders,
      vmSettings,
      networks,
      storages,
      iUserTemplates,
      iCommonTemplates,
      namespace: activeNamespace,
      openshiftFlag,
      isTemplate: isCreateTemplate,
      isProviderImport,
    })
      .then(() => getResults(enhancedK8sMethods))
      .catch((error) => cleanupAndGetResults(enhancedK8sMethods, error))
      .then(({ isValid, ...rest }: ResultsWrapper) =>
        this.props.onResultsChanged(rest, isValid, false, false),
      )
      .catch((e) => console.error(e)); // eslint-disable-line no-console
  };

  goBackToEditingSteps = () =>
    this.props.onResultsChanged(getResultInitialState({}).value, null, false, false);

  render() {
    const { reduxID, stepData, isSimpleView, isProviderImport } = this.props;

    if (this.isClosed || !stepData) {
      // closed or not initialized
      return null;
    }

    const steps = [
      {
        id: VMWizardTab.IMPORT_PROVIDERS,
        component: (
          <>
            <ResourceLoadErrors wizardReduxID={reduxID} />
            <ImportProvidersTab wizardReduxID={reduxID} />
          </>
        ),
      },
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
          {
            id: VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
            component: (
              <>
                <ResourceLoadErrors wizardReduxID={reduxID} />
                <VirtualHardwareTab wizardReduxID={reduxID} />
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

    const calculateStepsCanJumpTo = (
      initialSteps,
      initialAccumulator: WizardStep[] = [],
    ): WizardStep[] =>
      initialSteps.reduce((stepAcc: WizardStep[], step: any) => {
        const isFirstStep = _.isEmpty(stepAcc);
        let innerSteps;
        if (step.steps) {
          // pass reference to last step but remove it afterwards
          innerSteps = calculateStepsCanJumpTo(step.steps, isFirstStep ? [] : [_.last(stepAcc)]);
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
        const isPrevStepValid =
          isFirstStep ||
          (isSimpleView && isProviderImport
            ? isStepValid(stepData, VMWizardTab.IMPORT_PROVIDERS)
            : isStepValid(stepData, prevStep.id as VMWizardTab));
        const canJumpToPrevStep = isFirstStep || prevStep.canJumpTo;

        const calculatedStep = {
          ...step,
          name: TabTitleResolver[step.id] || step.name,
          canJumpTo:
            isStepLocked(stepData, VMWizardTab.RESULT) || isLastStepErrorFatal(stepData) // request in progress or failed
              ? step.id === VMWizardTab.RESULT
              : !isLocked &&
                isPrevStepValid &&
                canJumpToPrevStep &&
                // disable uninitialized RESULT step
                !(
                  step.id === VMWizardTab.RESULT &&
                  iGetIn(stepData, [VMWizardTab.RESULT, 'isValid']) == null
                ),
          component: step.component,
        };

        if (innerSteps) {
          calculatedStep.steps = innerSteps;
        }

        stepAcc.push(calculatedStep);
        return stepAcc;
      }, initialAccumulator);

    const calculateStepsVisibility = (initialSteps: WizardStep[]): WizardStep[] =>
      initialSteps
        .map((step) => {
          if (step.steps) {
            const newInnerSteps = calculateStepsVisibility(step.steps);
            return newInnerSteps.length > 0 ? { ...step, steps: newInnerSteps } : null;
          }
          return isStepHidden(stepData, step.id as VMWizardTab) ? null : step;
        })
        .filter((step) => step);

    return (
      <div className="kubevirt-create-vm-modal__container">
        {!isStepValid(stepData, VMWizardTab.RESULT) && (
          <div className="yaml-editor__header" key="header">
            <h1 className="yaml-editor__header-text">{this.getWizardTitle()}</h1>
          </div>
        )}
        <Wizard
          key="wizard"
          isInPage
          className="kubevirt-create-vm-modal__wizard-content"
          onClose={this.onClose}
          onNext={({ id }, { prevId }) => {
            if (id === VMWizardTab.RESULT && prevId !== VMWizardTab.RESULT) {
              this.finish();
            }
            if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
              this.goBackToEditingSteps();
            }
          }}
          onBack={({ id }, { prevId }) => {
            if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
              this.goBackToEditingSteps();
            }
          }}
          onGoToStep={({ id }, { prevId }) => {
            if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
              this.goBackToEditingSteps();
            }
          }}
          steps={calculateStepsVisibility(calculateStepsCanJumpTo(steps))}
          footer={<CreateVMWizardFooter wizardReduxID={reduxID} key="footer" />}
        />
      </div>
    );
  }
}

const wizardStateToProps = (state, { reduxID }) => ({
  stepData: iGetCreateVMWizardTabs(state, reduxID),
  // fetch data from store to detect and fire changes
  ...[...DetectCommonDataChanges]
    .filter((v) => v !== VMWizardProps.storageClassConfigMap) // passed directly
    .reduce((acc, propName) => {
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
          userTemplateName: props.userTemplateName,
          storageClassConfigMap: undefined,
          isSimpleView: props.isSimpleView,
        },
        dataIDReferences: props.dataIDReferences,
      } as CommonData),
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
  flags,
  wsResources,
}) => {
  const activeNamespace = match && match.params && match.params.ns;
  const searchParams = new URLSearchParams(location && location.search);

  const resources = [
    getResource(VirtualMachineModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.virtualMachines,
    }),
    getResource(DataVolumeModel, {
      namespace: activeNamespace,
      prop: VMWizardProps.dataVolumes,
    }),
  ];

  if (flags[FLAGS.OPENSHIFT]) {
    resources.push(
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
    );
  }

  const storageClassConfigMap = useStorageClassConfigMapWrapped();

  resources.push(...wsResources);

  const dataIDReferences = makeIDReferences(resources);

  dataIDReferences[VMWizardProps.activeNamespace] = ['UI', 'activeNamespace'];
  dataIDReferences[VMWizardProps.openshiftFlag] = [featureReducerName, FLAGS.OPENSHIFT];

  const userMode = searchParams.get('mode') || VMWizardMode.VM;
  const userTemplateName = (userMode === VMWizardMode.VM && searchParams.get('template')) || '';
  const isSimpleView =
    userMode === VMWizardMode.IMPORT &&
    searchParams.get('view')?.toLowerCase() !== VMWizardView.ADVANCED; // normal mode defaults to advanced

  return (
    <Firehose resources={resources} doNotConnectToState>
      <CreateVMWizard
        isCreateTemplate={userMode === VMWizardMode.TEMPLATE}
        isProviderImport={userMode === VMWizardMode.IMPORT}
        userTemplateName={userTemplateName}
        isSimpleView={isSimpleView}
        dataIDReferences={dataIDReferences}
        storageClassConfigMap={storageClassConfigMap}
        reduxID={reduxID}
        onClose={() => history.goBack()}
      />
    </Firehose>
  );
};

type CreateVMWizardPageComponentProps = {
  reduxID?: string;
  location?: Location;
  wsResources?: FirehoseResource[];
  match?: RouterMatch<{ ns: string; plural: string; appName?: string }>;
  flags: FlagsObject;
};

export const CreateVMWizardPage = compose(
  connectToFlags(FLAGS.OPENSHIFT),
  withReduxID,
  connect(
    (state, props: any) => ({ wsResources: iGetExtraWSQueries(state, props.reduxID) }),
    undefined,
    undefined,
    {
      areStatePropsEqual: _.isEqual,
    },
  ),
)(CreateVMWizardPageComponent);
