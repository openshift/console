import * as React from 'react';
import * as classNames from 'classnames';
import { RouteComponentProps } from 'react-router';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Wizard,
  WizardContextConsumer,
  WizardContextType,
} from '@patternfly/react-core';
import {
  K8sResourceCommon,
  PersistentVolumeClaimKind,
  PodKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import {
  PersistentVolumeClaimModel,
  PodModel,
  ProjectModel,
  TemplateModel,
} from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { history, LoadingBox } from '@console/internal/components/utils';

import { ReviewAndCreate } from './tabs/review-create';
import { SelectTemplate } from './tabs/select-template';
import { formReducer, FORM_ACTION_TYPE, initFormState } from './forms/create-vm-form-reducer';
import {
  CDI_APP_LABEL,
  DataVolumeSourceType,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VMWizardMode,
  VMWizardName,
} from '../../constants';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { useBaseImages } from '../../hooks/use-base-images';
import { filterTemplates } from '../vm-templates/utils';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';
import { isTemplateSourceError } from '../../statuses/template/types';
import { SuccessResultsComponent } from '../create-vm-wizard/tabs/result-tab/success-results';
import { getVMWizardCreateLink, parseVMWizardInitialData } from '../../utils/url';
import { BootSource } from './tabs/boot-source';
import { TemplateItem } from '../../types/template';
import {
  BOOT_ACTION_TYPE,
  BootSourceState,
  bootFormReducer,
  initBootFormState,
} from './forms/boot-source-form-reducer';
import { useSupportModal } from '../../hooks/use-support-modal';
import { useStorageClassConfigMap } from '../../hooks/storage-class-config-map';
import { createVM } from '../../k8s/requests/vm/create/simple-create';

import '../create-vm-wizard/create-vm-wizard.scss';
import './create-vm.scss';

enum WizardStep {
  TEMPLATE = 'Template',
  SOURCE = 'Source',
  REVIEW = 'Review',
}

type FooterProps = WizardContextType & {
  formIsValid: boolean;
  onFinish: VoidFunction;
  onCustomize: VoidFunction;
  customSource: BootSourceState;
  isCreating: boolean;
  createError: string;
  cleanError: VoidFunction;
  customBootSource: boolean;
  templateIsReady: boolean;
  template: TemplateItem;
  loaded: boolean;
};

const Footer: React.FC<FooterProps> = ({
  formIsValid,
  onFinish,
  onCustomize,
  customSource,
  isCreating,
  createError,
  cleanError,
  customBootSource,
  templateIsReady,
  children,
  template,
  activeStep,
  onNext,
  onBack,
  onClose,
  loaded,
}) => {
  const withSupportModal = useSupportModal();
  const isReview = activeStep.id === WizardStep.REVIEW;
  const isCustomSource = activeStep.id === WizardStep.SOURCE;
  const isSelectTemplate = activeStep.id === WizardStep.TEMPLATE;
  let canContinue = true;
  if (isReview) {
    canContinue = formIsValid;
  } else if (isSelectTemplate) {
    canContinue = templateIsReady || customBootSource;
  } else if (isCustomSource) {
    canContinue = customSource?.isValid;
  }
  return (
    <div
      className={classNames({
        'kv-create-vm__footer': isSelectTemplate,
      })}
    >
      {children}
      {createError && isReview && (
        <Alert
          className="kv-create-vm__error"
          variant={AlertVariant.danger}
          actionClose={<AlertActionCloseButton onClose={cleanError} />}
          title="Error creating VM"
        >
          {createError}
        </Alert>
      )}
      <footer className={styles.wizardFooter}>
        <Button
          variant="primary"
          type="submit"
          data-test-id="wizard-next"
          onClick={
            isReview
              ? onFinish
              : isSelectTemplate
              ? () => withSupportModal(template, onNext)
              : onNext
          }
          isDisabled={!canContinue || isCreating}
        >
          {isReview ? 'Create virtual machine' : 'Next'}
        </Button>
        {(isReview || isCustomSource) && (
          <Button
            variant="secondary"
            onClick={onCustomize}
            isDisabled={isCreating || !loaded}
            data-test-id="wizard-customize"
          >
            Customize virtual machine
          </Button>
        )}
        <Button variant="secondary" onClick={onBack} isDisabled={isSelectTemplate || isCreating}>
          Back
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isCreating}>
          Cancel
        </Button>
      </footer>
    </div>
  );
};

export const CreateVM: React.FC<RouteComponentProps> = ({ location }) => {
  const searchParams = new URLSearchParams(location && location.search);
  const initData = parseVMWizardInitialData(searchParams);
  const [namespace, setNamespace] = React.useState(searchParams.get('namespace'));
  const [state, dispatch] = React.useReducer(formReducer, initFormState(namespace));
  const [isCreating, setCreating] = React.useState(false);
  const [created, setCreated] = React.useState(false);
  const [createError, setCreateError] = React.useState<string>();
  const [templatePreselectError, setTemplatePreselectError] = React.useState<string>();
  const [selectedTemplate, selectTemplate] = React.useState<TemplateItem>();
  const [bootState, bootDispatch] = React.useReducer(bootFormReducer, initBootFormState);
  const [userTemplates, utLoaded, utError] = useK8sWatchResource<TemplateKind[]>({
    kind: TemplateModel.kind,
    namespace,
    selector: {
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    },
    isList: true,
  });
  const [baseTemplates, btLoaded, btError] = useK8sWatchResource<TemplateKind[]>({
    kind: TemplateModel.kind,
    namespace: 'openshift',
    selector: {
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    },
    isList: true,
  });
  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    namespace,
    isList: true,
    selector: {
      matchLabels: { app: CDI_APP_LABEL },
    },
  });
  const [dvs, dvsLoaded, dvsError] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: DataVolumeModel.kind,
    namespace,
    isList: true,
  });
  const [pvcs, pvcsLoaded, pvcsError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    isList: true,
  });
  const [baseImages, baseLoaded, baseError, baseDVs, basePods] = useBaseImages(baseTemplates, true);
  const [projects, projectsLoaded, projectsError] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: ProjectModel.kind,
    isList: true,
  });

  const [scConfigMap, scLoaded, scError] = useStorageClassConfigMap();

  const templates = filterTemplates(userTemplates, baseTemplates);
  const allPods = [...pods, ...basePods];
  const allDVs = [...dvs, ...baseDVs];
  const allPVCs = [...pvcs, ...baseImages];

  const loaded =
    utLoaded &&
    btLoaded &&
    podsLoaded &&
    dvsLoaded &&
    pvcsLoaded &&
    baseLoaded &&
    projectsLoaded &&
    scLoaded;
  const loadError =
    utError ||
    btError ||
    podsError ||
    dvsError ||
    pvcsError ||
    baseError ||
    projectsError ||
    scError;

  const sourceStatus =
    selectedTemplate &&
    getTemplateSourceStatus({
      pvcs: allPVCs,
      template: selectedTemplate.variants[0],
      pods: allPods,
      dataVolumes: allDVs,
    });

  React.useEffect(() => {
    if ((initData.commonTemplateName || initData.userTemplateName) && !selectedTemplate && loaded) {
      const name = initData.commonTemplateName ?? initData.userTemplateName;
      const ns = initData.commonTemplateName ? 'openshift' : initData.userTemplateNs;
      let templateVariant: TemplateKind;
      const templateItem = templates?.find((tItem) => {
        templateVariant = tItem.variants.find(
          (v) => v.metadata.name === name && v.metadata.namespace === ns,
        );
        return !!templateVariant;
      });
      if (templateVariant) {
        selectTemplate(templateItem);
        dispatch({ type: FORM_ACTION_TYPE.SET_TEMPLATE, payload: templateVariant });
      } else {
        setTemplatePreselectError('Requested template could not be found');
      }
    }
  }, [loaded, initData, templates, userTemplates, selectedTemplate]);

  let templateIsReady = false;
  let customBootSource = false;
  let selectTemplateAlert: React.ReactNode;
  if (selectedTemplate) {
    if (selectedTemplate.isCommon) {
      if (!sourceStatus) {
        customBootSource = true;
        templateIsReady = true;
      } else if (isTemplateSourceError(sourceStatus)) {
        customBootSource = false;
        templateIsReady = false;
        selectTemplateAlert = (
          <Alert
            variant="danger"
            isInline
            title="The boot source for the chosen template is in error state. Please repair the boot source."
          />
        );
      } else if (!sourceStatus.isReady) {
        customBootSource = false;
        templateIsReady = false;
        selectTemplateAlert = (
          <Alert
            variant="info"
            isInline
            title="The boot source for the chosen template is still being prepared. Please wait until complete."
          />
        );
      } else {
        templateIsReady = true;
        customBootSource = false;
      }
    } else {
      templateIsReady =
        sourceStatus && !isTemplateSourceError(sourceStatus) && sourceStatus.isReady;
    }
  }

  const dataSource = DataVolumeSourceType.fromString(bootState.dataSource?.value);

  const onCustomize = () =>
    history.push(
      getVMWizardCreateLink({
        namespace: state.namespace || namespace,
        wizardName: VMWizardName.WIZARD,
        mode: VMWizardMode.VM,
        template: state.template,
        name: state.name,
        startVM: state.startVM,
        bootSource: dataSource
          ? {
              size:
                dataSource === DataVolumeSourceType.PVC
                  ? bootState.pvcSize?.value
                  : `${bootState.size?.value.value}${bootState.size?.value.unit}`,
              cdRom: bootState.cdRom?.value,
              url: dataSource === DataVolumeSourceType.HTTP ? bootState.url?.value : undefined,
              container:
                dataSource === DataVolumeSourceType.REGISTRY
                  ? bootState.container?.value
                  : undefined,
              pvcName:
                dataSource === DataVolumeSourceType.PVC ? bootState.pvcName?.value : undefined,
              pvcNamespace:
                dataSource === DataVolumeSourceType.PVC ? bootState.pvcNamespace?.value : undefined,
            }
          : undefined,
      }),
    );

  let body: React.ReactNode;
  if (created) {
    body = <SuccessResultsComponent name={state.name} namespace={state.namespace} />;
  } else if (
    (initData.commonTemplateName || initData.userTemplateName) &&
    !templateIsReady &&
    !templatePreselectError
  ) {
    body = <LoadingBox />;
  } else {
    const steps = [
      {
        id: WizardStep.TEMPLATE,
        name: 'Select template',
        component: (
          <SelectTemplate
            loaded={loaded}
            loadError={loadError}
            pods={allPods}
            pvcs={allPVCs}
            dataVolumes={allDVs}
            templates={templates}
            selectedTemplate={selectedTemplate}
            selectTemplate={(template) => {
              selectTemplate(template);
              bootDispatch({ type: BOOT_ACTION_TYPE.RESET });
              dispatch({ type: FORM_ACTION_TYPE.RESET });
              dispatch({ type: FORM_ACTION_TYPE.SET_TEMPLATE, payload: template.variants[0] });
            }}
            namespace={namespace}
            setNamespace={setNamespace}
            namespaces={projects.map((p) => p.metadata.name)}
            templatePreselectError={templatePreselectError}
          />
        ),
        canJumpTo: !isCreating,
      },
      {
        id: WizardStep.REVIEW,
        name: 'Review and create',
        component: (
          <ReviewAndCreate
            sourceStatus={sourceStatus}
            template={selectedTemplate}
            state={state}
            dispatch={dispatch}
            customSource={bootState}
          />
        ),
        canJumpTo: !isCreating && templateIsReady && (customBootSource ? bootState.isValid : true),
      },
    ];

    if (customBootSource) {
      steps.splice(1, 0, {
        id: WizardStep.SOURCE,
        name: 'Boot source',
        component: (
          <BootSource template={selectedTemplate} state={bootState} dispatch={bootDispatch} />
        ),
        canJumpTo: !isCreating,
      });
    }

    body = (
      <Wizard
        hasNoBodyPadding
        onClose={history.goBack}
        steps={steps}
        startAtStep={
          (initData.commonTemplateName ?? initData.userTemplateName) &&
          !templatePreselectError &&
          !loadError
            ? 2
            : 1
        }
        footer={
          <WizardContextConsumer>
            {(footerProps) => (
              <Footer
                {...footerProps}
                formIsValid={state.isValid}
                isCreating={isCreating}
                createError={createError}
                cleanError={() => setCreateError(undefined)}
                onFinish={async () => {
                  setCreateError(undefined);
                  setCreating(true);
                  try {
                    await createVM(state.template, sourceStatus, bootState, state, scConfigMap);
                    setCreated(true);
                  } catch (err) {
                    setCreateError(err?.message || 'Error occured while creating VM.');
                  } finally {
                    setCreating(false);
                  }
                }}
                onCustomize={onCustomize}
                customSource={bootState}
                customBootSource={customBootSource}
                templateIsReady={templateIsReady}
                template={selectedTemplate}
                loaded={loaded}
              >
                {selectTemplateAlert}
              </Footer>
            )}
          </WizardContextConsumer>
        }
      />
    );
  }

  return (
    <div className="kubevirt-create-vm-modal__container">
      <div className="yaml-editor__header">
        <h1 className="yaml-editor__header-text">Create Virtual Machine from template</h1>
      </div>
      {body}
    </div>
  );
};
