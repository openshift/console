import * as React from 'react';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { Location } from 'history';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { match as RouterMatch } from 'react-router';
import { compose } from 'redux';
import { Firehose, history } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { connectToFlags } from '@console/internal/reducers/connectToFlags';
import { featureReducerName, FlagsObject } from '@console/internal/reducers/features';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { FLAGS } from '@console/shared';
import { usePrevious } from '@console/shared/src/hooks/previous';
import { VMWizardURLParams } from '../../constants/url-params';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VMWizardMode,
  VMWizardView,
} from '../../constants/vm';
import { useStorageClassConfigMapWrapped } from '../../hooks/storage-class-config-map';
import { useBaseImages } from '../../hooks/use-base-images';
import { useUpdateStorages } from '../../hooks/use-update-data-volume';
import { VirtualMachineModel } from '../../models';
import { getTemplateName } from '../../selectors/vm-template/basic';
import { FirehoseResourceEnhanced } from '../../types/custom';
import { ITemplate } from '../../types/template';
import { VMWizardInitialData } from '../../types/url';
import { getResource } from '../../utils';
import { iGetLoadedData, immutableListToShallowJS } from '../../utils/immutable';
import { withReduxID } from '../../utils/redux/common';
import { IDReferences, makeIDReferences } from '../../utils/redux/id-reference';
import { parseVMWizardInitialData } from '../../utils/url';
import { CreateVMWizardFooter } from './create-vm-wizard-footer';
import { ResourceLoadErrors } from './error-components/resource-load-errors';
import { WizardErrors } from './error-components/wizard-errors';
import { vmWizardActions } from './redux/actions';
import { getResultInitialState } from './redux/initial-state/result-tab-initial-state';
import { ActionType } from './redux/types';
import { iGetCommonData, iGetLoadedCommonData, iGetName } from './selectors/immutable/selectors';
import {
  getStepsMetadata,
  isLastStepErrorFatal,
  isStepValid,
} from './selectors/immutable/wizard-selectors';
import { getExtraWSQueries } from './selectors/selectors';
import { TabTitleKeyResolver } from './strings/strings';
import AdvancedTab from './tabs/advanced-tab/AdvancedTab';
import { ImportProvidersTab } from './tabs/import-providers-tab/import-providers-tab';
import { NetworkingTab } from './tabs/networking-tab/networking-tab';
import { ResultTab } from './tabs/result-tab/result-tab';
import { ReviewTab } from './tabs/review-tab/review-tab';
import { StorageTab } from './tabs/storage-tab/storage-tab';
import { ValidTabGuard } from './tabs/valid-tab-guard';
import { VMSettingsTab } from './tabs/vm-settings-tab/vm-settings-tab';
import {
  ChangedCommonData,
  ChangedCommonDataProp,
  CommonData,
  DetectCommonDataChanges,
  DirectCommonDataProps,
  VMWizardProps,
  VMWizardTab,
  VMWizardTabsMetadata,
} from './types';

import './create-vm-wizard.scss';

type CreateVMWizardComponentProps = {
  isSimpleView: boolean;
  isProviderImport: boolean;
  isCreateTemplate: boolean;
  isLastTabErrorFatal: boolean;
  initialData: VMWizardInitialData;
  dataIDReferences: IDReferences;
  reduxID: string;
  tabsMetadata: VMWizardTabsMetadata;
  iUserTemplate: ITemplate;
  onInitialize: () => void;
  onClose: (disposeOnly: boolean) => void;
  createVM: () => void;
  onCommonDataChanged: (commonData: CommonData, commonDataChanged: ChangedCommonData) => void;
  onResultsChanged: (results, isValid: boolean, isLocked: boolean, isPending: boolean) => void;
} & { [k in ChangedCommonDataProp]: any };

const CreateVMWizardComponent: React.FC<CreateVMWizardComponentProps> = (props) => {
  const { t } = useTranslation();
  const closed = React.useRef(false);

  const onClose = React.useCallback(
    (disposeOnly?: boolean) => {
      if (closed.current) {
        return;
      }
      closed.current = true;
      props.onClose(disposeOnly);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React.useEffect(() => {
    props.onInitialize();

    return () => {
      onClose(true);
    };
    // constuctor/desctructor logic - should run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store previuse props
  const prevProps = usePrevious<CreateVMWizardComponentProps>(props);

  // componentDidUpdate
  // takes care about firing onCommonDataChanged when fresh data is detected in props
  React.useEffect(() => {
    if (closed.current || !prevProps) {
      return;
    }

    const changedProps = [...DetectCommonDataChanges].reduce((changedPropsAcc, propName) => {
      if (prevProps[propName] !== props[propName]) {
        changedPropsAcc.add(propName);
      }
      return changedPropsAcc;
    }, new Set()) as ChangedCommonData;
    // lightweight equal - heavy computation should not occur here.
    const referencesChanged = !_.isEqual(prevProps.dataIDReferences, props.dataIDReferences);

    if (changedProps.size > 0 || referencesChanged) {
      let commonDataUpdate: CommonData = referencesChanged
        ? { dataIDReferences: props.dataIDReferences }
        : undefined;

      commonDataUpdate = [...DirectCommonDataProps]
        .filter((propName) => changedProps.has(propName))
        .reduce((updateAcc, propName) => {
          return {
            ...updateAcc,
            data: {
              ...updateAcc?.data,
              [propName]: props[propName],
            },
          };
        }, commonDataUpdate);
      props.onCommonDataChanged(commonDataUpdate, changedProps);
    }
  });

  const getWizardTitle = () => {
    const {
      isCreateTemplate,
      isProviderImport,
      iUserTemplate,
      commonTemplates,
      initialData: { commonTemplateName },
    } = props;
    if (isCreateTemplate) {
      return t('kubevirt-plugin~Create Virtual Machine template');
    }
    if (isProviderImport) {
      return t('kubevirt-plugin~Import Virtual Machine');
    }
    if (iUserTemplate) {
      return t('kubevirt-plugin~Create Virtual Machine from {{template}}', {
        template: iGetName(iUserTemplate),
      });
    }

    const templates = immutableListToShallowJS(iGetLoadedData(commonTemplates));
    const template = templates?.find((tmp) => tmp.metadata.name === commonTemplateName);
    const templateName = getTemplateName(template);

    return t('kubevirt-plugin~Create Virtual Machine from {{template}}', {
      template: templateName,
    });
  };

  const goBackToEditingSteps = () =>
    props.onResultsChanged(getResultInitialState({}).value, null, false, false);

  const { reduxID, tabsMetadata } = props;

  if (closed.current || _.isEmpty(tabsMetadata)) {
    // closed or not initialized
    return null;
  }

  const steps = [
    {
      id: VMWizardTab.IMPORT_PROVIDERS,
      name: t(TabTitleKeyResolver[VMWizardTab.IMPORT_PROVIDERS]),
      canJumpTo: tabsMetadata[VMWizardTab.IMPORT_PROVIDERS]?.canJumpTo,
      component: (
        <>
          <ResourceLoadErrors wizardReduxID={reduxID} key="errors" />
          <ValidTabGuard
            wizardReduxID={reduxID}
            tabID={VMWizardTab.IMPORT_PROVIDERS}
            key="wizard-errors"
          >
            <WizardErrors wizardReduxID={reduxID} />
          </ValidTabGuard>
          <ImportProvidersTab wizardReduxID={reduxID} key={VMWizardTab.IMPORT_PROVIDERS} />
        </>
      ),
    },
    {
      id: VMWizardTab.VM_SETTINGS,
      name: t(TabTitleKeyResolver[VMWizardTab.VM_SETTINGS]),
      canJumpTo: tabsMetadata[VMWizardTab.VM_SETTINGS]?.canJumpTo,
      component: (
        <>
          <ResourceLoadErrors wizardReduxID={reduxID} key="errors" />
          <WizardErrors wizardReduxID={reduxID} key="wizard-errors" />
          <VMSettingsTab wizardReduxID={reduxID} key={VMWizardTab.VM_SETTINGS} />
        </>
      ),
    },
    {
      id: VMWizardTab.NETWORKING,
      name: t(TabTitleKeyResolver[VMWizardTab.NETWORKING]),
      canJumpTo: tabsMetadata[VMWizardTab.NETWORKING]?.canJumpTo,
      component: (
        <>
          <ResourceLoadErrors wizardReduxID={reduxID} key="errors" />
          <WizardErrors wizardReduxID={reduxID} key="wizard-errors" />
          <NetworkingTab wizardReduxID={reduxID} key={VMWizardTab.NETWORKING} />
        </>
      ),
    },
    {
      id: VMWizardTab.STORAGE,
      name: t(TabTitleKeyResolver[VMWizardTab.STORAGE]),
      canJumpTo: tabsMetadata[VMWizardTab.STORAGE]?.canJumpTo,
      component: (
        <>
          <ResourceLoadErrors wizardReduxID={reduxID} key="errors" />
          <WizardErrors wizardReduxID={reduxID} key="wizard-errors" />
          <StorageTab wizardReduxID={reduxID} key={VMWizardTab.STORAGE} />
        </>
      ),
    },
    {
      id: VMWizardTab.ADVANCED,
      name: t(TabTitleKeyResolver[VMWizardTab.ADVANCED]),
      canJumpTo: tabsMetadata[VMWizardTab.ADVANCED]?.canJumpTo,
      component: (
        <>
          <ResourceLoadErrors wizardReduxID={reduxID} key="errors" />
          <WizardErrors wizardReduxID={reduxID} key="wizard-errors" />
          <AdvancedTab wizardReduxID={reduxID} key={VMWizardTab.ADVANCED} />
        </>
      ),
    },
    {
      id: VMWizardTab.REVIEW,
      name: t(TabTitleKeyResolver[VMWizardTab.REVIEW]),
      canJumpTo: tabsMetadata[VMWizardTab.REVIEW]?.canJumpTo,
      component: (
        <>
          <WizardErrors wizardReduxID={reduxID} key="wizard-errors" />
          <ReviewTab wizardReduxID={reduxID} key={VMWizardTab.REVIEW} />
        </>
      ),
    },
    {
      id: VMWizardTab.RESULT,
      name: t(TabTitleKeyResolver[VMWizardTab.RESULT]),
      canJumpTo: tabsMetadata[VMWizardTab.RESULT]?.canJumpTo,
      isFinishedStep:
        tabsMetadata[VMWizardTab.RESULT].isPending || tabsMetadata[VMWizardTab.RESULT].isValid,
      component: <ResultTab wizardReduxID={reduxID} key={VMWizardTab.RESULT} />,
    },
  ];

  const calculateStepsVisibility = (initialSteps: WizardStep[]): WizardStep[] =>
    initialSteps
      .map((step) => {
        if (step.steps) {
          const newInnerSteps = calculateStepsVisibility(step.steps);
          return newInnerSteps.length > 0 ? { ...step, steps: newInnerSteps } : null;
        }
        return tabsMetadata[step.id as VMWizardTab]?.isHidden ? null : step;
      })
      .filter((step) => step);

  return (
    <div className="kubevirt-create-vm-modal__container">
      {!tabsMetadata[VMWizardTab.RESULT].isValid && (
        <div className="yaml-editor__header" key="header">
          <h1 className="yaml-editor__header-text">{getWizardTitle()}</h1>
        </div>
      )}
      <Wizard
        key="wizard"
        className="kubevirt-create-vm-modal__wizard-content"
        onClose={onClose}
        onNext={({ id }, { prevId }) => {
          if (id === VMWizardTab.RESULT && prevId !== VMWizardTab.RESULT) {
            props.createVM();
          }
          if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
            goBackToEditingSteps();
          }
        }}
        onBack={({ id }, { prevId }) => {
          if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
            goBackToEditingSteps();
          }
        }}
        onGoToStep={({ id }, { prevId }) => {
          if (prevId === VMWizardTab.RESULT && id !== VMWizardTab.RESULT) {
            goBackToEditingSteps();
          }
        }}
        steps={calculateStepsVisibility(steps)}
        footer={<CreateVMWizardFooter wizardReduxID={reduxID} key="footer" />}
      />
    </div>
  );
};

const wizardStateToProps = (state, { reduxID }) => ({
  isLastTabErrorFatal: isLastStepErrorFatal(state, reduxID),
  tabsMetadata: getStepsMetadata(state, reduxID),
  iUserTemplate: iGetLoadedCommonData(state, reduxID, VMWizardProps.userTemplate),
  // fetch data from store to detect and fire changes
  ...[...DetectCommonDataChanges]
    .filter((v) => !DirectCommonDataProps.has(v)) // ignore props that are passed directly
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
          isTemplateInitialized: false,
          initialData: props.initialData,
          storageClassConfigMap: undefined,
          openshiftCNVBaseImages: undefined,
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

  createVM: () => {
    dispatch(vmWizardActions[ActionType.CreateVM](props.reduxID));
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

const CreateVMWizard = connect(wizardStateToProps, wizardDispatchToProps, null, {
  areStatePropsEqual: (nextStateProps, prevStateProps) =>
    Object.keys(nextStateProps).every((key) => {
      const prev = prevStateProps[key];
      const next = nextStateProps[key];
      if (key === 'tabsMetadata') {
        return _.isEqual(prev, next); // should have only simple values max one level deep
      }
      return prev === next;
    }),
})(CreateVMWizardComponent);

export const CreateVMWizardPageComponent: React.FC<CreateVMWizardPageComponentProps> = ({
  reduxID,
  match,
  location,
  flags,
  wsResources,
  commonTemplates,
  hasCompleted,
}) => {
  const activeNamespace = match && match.params && match.params.ns;
  const searchParams = new URLSearchParams(location && location.search);
  const userMode = searchParams.get(VMWizardURLParams.MODE) || VMWizardMode.VM;

  const initialData = parseVMWizardInitialData(searchParams);

  let resources: FirehoseResourceEnhanced[] = [];

  if (!hasCompleted) {
    resources = [
      getResource(VirtualMachineModel, {
        namespace: activeNamespace,
        prop: VMWizardProps.virtualMachines,
      }),
    ];

    if (userMode !== VMWizardMode.IMPORT) {
      resources.push({
        kind: referenceForModel(NetworkAttachmentDefinitionModel),
        model: NetworkAttachmentDefinitionModel,
        isList: true,
        namespace: activeNamespace,
        prop: VMWizardProps.nads,
        errorBehaviour: {
          ignore404: true,
        },
      });
    }

    if (flags[FLAGS.OPENSHIFT]) {
      resources.push(
        getResource(TemplateModel, {
          namespace: 'openshift',
          prop: VMWizardProps.commonTemplates,
          matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
        }),
      );

      if (userMode === VMWizardMode.TEMPLATE) {
        resources.push(
          getResource(TemplateModel, {
            namespace: activeNamespace,
            prop: VMWizardProps.userTemplates,
            matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
          }),
        );
      }

      if (initialData.userTemplateName) {
        resources.push(
          getResource(TemplateModel, {
            name: initialData.userTemplateName,
            namespace: initialData.userTemplateNs,
            prop: VMWizardProps.userTemplate,
            isList: false,
            matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
          }),
        );
      }
    }
    resources.push(...wsResources);
  }

  const storageClassConfigMap = useStorageClassConfigMapWrapped();

  const loadedCommonTemplates = React.useMemo(
    () =>
      userMode === VMWizardMode.IMPORT // make empty for import so no PVCBaseImages get loaded
        ? []
        : immutableListToShallowJS(iGetLoadedData(commonTemplates)),
    [commonTemplates, userMode],
  );

  useUpdateStorages(reduxID);
  const openshiftCNVBaseImagesListResult = useBaseImages(loadedCommonTemplates);
  // TODO integrate the list of watches into the redux store to prevent unnecessary copying of data
  const openshiftCNVBaseImages = React.useMemo(
    () => ({
      data: openshiftCNVBaseImagesListResult[0],
      loaded: openshiftCNVBaseImagesListResult[1],
      loadError: openshiftCNVBaseImagesListResult[2],
    }),
    [openshiftCNVBaseImagesListResult],
  );

  const dataIDReferences = makeIDReferences(resources);

  dataIDReferences[VMWizardProps.activeNamespace] = ['UI', 'activeNamespace'];
  dataIDReferences[VMWizardProps.openshiftFlag] = [featureReducerName, FLAGS.OPENSHIFT];

  const isSimpleView =
    userMode === VMWizardMode.IMPORT &&
    searchParams.get('view')?.toLowerCase() !== VMWizardView.ADVANCED; // normal mode defaults to advanced

  return (
    <Firehose resources={resources} doNotConnectToState>
      <CreateVMWizard
        isCreateTemplate={userMode === VMWizardMode.TEMPLATE}
        isProviderImport={userMode === VMWizardMode.IMPORT}
        isSimpleView={isSimpleView}
        dataIDReferences={dataIDReferences}
        storageClassConfigMap={storageClassConfigMap}
        openshiftCNVBaseImages={openshiftCNVBaseImages}
        reduxID={reduxID}
        onClose={history.goBack}
        initialData={initialData}
      />
    </Firehose>
  );
};

type CreateVMWizardPageComponentProps = {
  reduxID?: string;
  location?: Location;
  wsResources?: FirehoseResourceEnhanced[];
  commonTemplates?: any;
  hasCompleted: boolean;
  match?: RouterMatch<{ ns: string; plural: string; appName?: string }>;
  flags: FlagsObject;
};

export const CreateVMWizardPage = compose(
  connectToFlags(FLAGS.OPENSHIFT),
  withReduxID,
  connect(
    (state, props: any) => ({
      hasCompleted: isStepValid(state, props.reduxID, VMWizardTab.RESULT),
      wsResources: getExtraWSQueries(state, props.reduxID),
      [VMWizardProps.commonTemplates]: iGetCommonData(
        state,
        props.reduxID,
        VMWizardProps.commonTemplates,
      ),
    }),
    undefined,
    undefined,
    {
      areStatePropsEqual: _.isEqual,
    },
  ),
)(CreateVMWizardPageComponent);
