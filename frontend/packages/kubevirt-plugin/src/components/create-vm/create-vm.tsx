import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Wizard,
  WizardContextConsumer,
  WizardContextType,
} from '@patternfly/react-core';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import * as classNames from 'classnames';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sResourceCommon, TemplateKind } from '@console/internal/module/k8s';
import { DataVolumeSourceType, VMWizardMode, VMWizardName, VolumeType } from '../../constants';
import { useStorageClassConfigMap } from '../../hooks/storage-class-config-map';
import { useErrorTranslation } from '../../hooks/use-error-translation';
import useSSHKeys from '../../hooks/use-ssh-keys';
import useSSHService from '../../hooks/use-ssh-service';
import { useSupportModal } from '../../hooks/use-support-modal';
import useV2VConfigMap from '../../hooks/use-v2v-config-map';
import { createVM } from '../../k8s/requests/vm/create/simple-create';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { selectVM } from '../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';
import { isTemplateSourceError } from '../../statuses/template/types';
import { TemplateItem } from '../../types/template';
import { getVMWizardCreateLink, parseVMWizardInitialData } from '../../utils/url';
import { SuccessResultsComponent } from '../create-vm-wizard/tabs/result-tab/success-results';
import { AUTHORIZED_SSH_KEYS } from '../ssh-service/SSHForm/ssh-form-utils';
import { filterTemplates } from '../vm-templates/utils';
import {
  BOOT_ACTION_TYPE,
  bootFormReducer,
  BootSourceState,
  initBootFormState,
} from './forms/boot-source-form-reducer';
import { FORM_ACTION_TYPE, formReducer, initFormState } from './forms/create-vm-form-reducer';
import { useVmTemplatesResources } from './hooks/use-vm-templates-resources';
import { BootSource } from './tabs/boot-source';
import { ReviewAndCreate } from './tabs/review-create';
import { SelectTemplate } from './tabs/select-template';

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
  createError: React.ReactNode;
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
  const { t } = useTranslation();
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
          title={t('kubevirt-plugin~Error creating VM')}
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
              ? () => withSupportModal(template.variants[0], onNext)
              : onNext
          }
          isDisabled={!canContinue || isCreating}
        >
          {isReview ? t('kubevirt-plugin~Create virtual machine') : t('kubevirt-plugin~Next')}
        </Button>
        {(isReview || isCustomSource) && (
          <Button
            variant="secondary"
            onClick={onCustomize}
            isDisabled={isCreating || !loaded}
            data-test-id="wizard-customize"
          >
            {t('kubevirt-plugin~Customize virtual machine')}
          </Button>
        )}
        <Button variant="secondary" onClick={onBack} isDisabled={isSelectTemplate || isCreating}>
          {t('kubevirt-plugin~Back')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isCreating}>
          {t('kubevirt-plugin~Cancel')}
        </Button>
      </footer>
    </div>
  );
};

export const CreateVM: React.FC<RouteComponentProps> = ({ location }) => {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location && location.search);
  const initData = parseVMWizardInitialData(searchParams);
  const [namespace, setNamespace] = React.useState(searchParams.get('namespace'));
  const [state, dispatch] = React.useReducer(formReducer, initFormState(namespace));
  const [isCreating, setCreating] = React.useState(false);
  const [created, setCreated] = React.useState(false);
  const [createError, setCreateError, setCreateErrorKey, resetError] = useErrorTranslation();
  const [templatePreselectError, setTemplatePreselectError] = React.useState<string>();
  const [selectedTemplate, selectTemplate] = React.useState<TemplateItem>();
  const [bootState, bootDispatch] = React.useReducer(bootFormReducer, initBootFormState);
  const {
    enableSSHService,
    tempSSHKey,
    isValidSSHKey,
    createOrUpdateSecret,
    updateSSHKeyInGlobalNamespaceSecret,
    restoreDefaultSSHSettings,
  } = useSSHKeys();
  const { createOrDeleteSSHService } = useSSHService();

  const [projects, projectsLoaded, projectsError] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: ProjectModel.kind,
    isList: true,
  });

  const [V2VConfigMapImages, V2VConfigMapImagesLoaded, V2VConfigMapImagesError] = useV2VConfigMap();

  const [scConfigMap, scLoaded, scError] = useStorageClassConfigMap();
  const {
    pods,
    dataVolumes,
    pvcs,
    userTemplates,
    baseTemplates,
    resourcesLoaded,
    resourcesLoadError,
  } = useVmTemplatesResources(namespace);

  const templates = filterTemplates([...userTemplates, ...baseTemplates]);

  const loaded = resourcesLoaded && projectsLoaded && scLoaded && V2VConfigMapImagesLoaded;
  const loadError = resourcesLoadError || projectsError || scError || V2VConfigMapImagesError;

  const sourceStatus =
    selectedTemplate &&
    getTemplateSourceStatus({
      pvcs,
      template: selectedTemplate.variants[0],
      pods,
      dataVolumes,
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
        // t('kubevirt-plugin~Requested template could not be found')
        setTemplatePreselectError('kubevirt-plugin~Requested template could not be found');
      }
    }
  }, [loaded, initData, templates, userTemplates, selectedTemplate, t]);

  React.useEffect(() => {
    const vm = new VMWrapper(selectVM(selectedTemplate?.variants?.[0]));
    const bootDevice = vm.getBootDevice();

    if (bootDevice?.type === 'disk') {
      const vol = new VolumeWrapper(
        vm.getVolumes()?.find((v) => v?.name === bootDevice?.device?.name),
      );
      const dv =
        vol.getType() === VolumeType.DATA_VOLUME &&
        vm.getDataVolumeTemplates()?.find((d) => d?.metadata?.name === vol?.getDataVolumeName());

      if (dv) {
        const dvWrapper = new DataVolumeWrapper(dv);
        const storage = dvWrapper.getSize();
        bootDispatch({
          type: BOOT_ACTION_TYPE.SET_SIZE,
          payload: {
            value: storage.value,
            unit: storage.unit,
          },
        });
      }
    }
  }, [selectedTemplate]);

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
            title={t(
              'kubevirt-plugin~The boot source for the chosen template is in error state. Please repair the boot source.',
            )}
          />
        );
      } else if (!sourceStatus.isReady) {
        customBootSource = false;
        templateIsReady = false;
        selectTemplateAlert = (
          <Alert
            variant="info"
            isInline
            title={t(
              'kubevirt-plugin~The boot source for the chosen template is still being prepared. Please wait until complete.',
            )}
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
        name: t('kubevirt-plugin~Select template'),
        component: (
          <SelectTemplate
            loaded={loaded}
            loadError={loadError}
            pods={pods}
            pvcs={pvcs}
            dataVolumes={dataVolumes}
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
        name: t('kubevirt-plugin~Review and create'),
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
        name: t('kubevirt-plugin~Boot source'),
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
                formIsValid={state.isValid && isValidSSHKey}
                isCreating={isCreating}
                createError={createError}
                cleanError={() => setCreateError(undefined)}
                onFinish={async () => {
                  resetError();
                  setCreating(true);
                  try {
                    const vm = await createVM(
                      state.template,
                      sourceStatus,
                      bootState,
                      state,
                      scConfigMap,
                      tempSSHKey,
                      enableSSHService,
                      V2VConfigMapImages,
                    );
                    if (vm) {
                      enableSSHService && createOrDeleteSSHService(vm);
                      if (!isEmpty(tempSSHKey)) {
                        createOrUpdateSecret(tempSSHKey, vm?.metadata?.namespace, {
                          secretName: `${AUTHORIZED_SSH_KEYS}-${vm?.metadata?.name}`,
                          create: true,
                        });
                        updateSSHKeyInGlobalNamespaceSecret &&
                          createOrUpdateSecret(tempSSHKey, vm?.metadata?.namespace);
                      }
                      restoreDefaultSSHSettings();
                    }
                    setCreated(true);
                  } catch (err) {
                    // t('kubevirt-plugin~Error occured while creating VM.')
                    err?.message
                      ? setCreateError(err.message)
                      : setCreateErrorKey('kubevirt-plugin~Error occured while creating VM.');
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
        <h1 className="yaml-editor__header-text">
          {t('kubevirt-plugin~Create Virtual Machine from template')}
        </h1>
      </div>
      {body}
    </div>
  );
};
