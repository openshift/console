import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  Divider,
  Form,
  Grid,
  GridItem,
  SelectOption,
  SelectVariant,
  Stack,
  StackItem,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { dropdownUnits } from '@console/internal/components/storage/shared';
import {
  convertToBaseValue,
  history,
  isUpstream,
  RequestSizeInput,
  StatusBox,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, TemplateKind } from '@console/internal/module/k8s';
import {
  KUBEVIRT_OS_IMAGES_NS,
  OPENSHIFT_OS_IMAGES_NS,
  TEMPLATE_PROVIDER_ANNOTATION,
  TEMPLATE_SUPPORT_LEVEL,
  TEMPLATE_TYPE_LABEL,
  VM_CUSTOMIZE_LABEL,
} from '../../../constants';
import { VIRTUALIZATION_BASE_URL } from '../../../constants/url-params';
import { TemplateSupport } from '../../../constants/vm-templates/support';
import { TEMPLATE_CUSTOMIZED_ANNOTATION } from '../../../constants/vm/constants';
import { useBaseImages } from '../../../hooks/use-base-images';
import useV2VConfigMap from '../../../hooks/use-v2v-config-map';
import { createVMForCustomization } from '../../../k8s/requests/vmtemplate/customize';
import { CloudInitDataHelper } from '../../../k8s/wrapper/vm/cloud-init-data-helper';
import { VMTemplateWrapper } from '../../../k8s/wrapper/vm/vm-template-wrapper';
import { DataSourceModel, DataVolumeModel, VirtualMachineModel } from '../../../models/index';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { getAnnotation } from '../../../selectors/selectors';
import { getTemplateFlavorData, getTemplateMemory } from '../../../selectors/vm-template/advanced';
import { selectVM } from '../../../selectors/vm-template/basic';
import { vCPUCount } from '../../../selectors/vm/cpu';
import { getCPU } from '../../../selectors/vm/selectors';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { isTemplateSourceError } from '../../../statuses/template/types';
import { DataSourceKind, VMKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import { validateVmLikeEntityName } from '../../../utils/validations';
import { FormPFSelect } from '../../form/form-pf-select';
import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { preventDefault } from '../../form/utils';
import { filterTemplates } from '../utils';
import { FORM_ACTION_TYPE, formReducer, initFormState } from './customize-source-form-reducer';
import './customize-source.scss';

const CustomizeSourceForm: React.FC<RouteComponentProps> = ({ location }) => {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(location.search);
  const templateName = urlParams.get('template');
  const templateNs = urlParams.get('templateNs') || 'openshift';

  const [creatingVM, setCreatingVM] = React.useState(false);
  const [vmError, setVMError] = React.useState();
  const [
    { name, namespace, cloudInit, injectCloudInit, selectedTemplate, size, provider, support },
    formDispatch,
  ] = React.useReducer(formReducer, initFormState(urlParams.get('ns')));
  const [V2VConfigMapImages, V2VConfigMapImagesLoaded] = useV2VConfigMap();

  const [templates, loaded, loadError] = useK8sWatchResource<TemplateKind[]>({
    kind: TemplateModel.kind,
    isList: true,
    namespace: templateNs,
    selector: {
      matchExpressions: [
        {
          key: TEMPLATE_TYPE_LABEL,
          operator: 'Exists',
        },
      ],
    },
  });

  const [
    vmWithCustomBootSource,
    loadvmWithCutomBootSource,
    vmWithCustomBootSourceError,
  ] = useK8sWatchResource<VMKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineModel),
    isList: true,
    namespace,
    selector: {
      matchLabels: {
        [VM_CUSTOMIZE_LABEL]: 'true',
      },
    },
  });

  const templatesFromVms = React.useMemo(
    () =>
      vmWithCustomBootSource.map(({ metadata }) =>
        JSON.parse(metadata?.annotations?.[TEMPLATE_CUSTOMIZED_ANNOTATION]),
      ),
    [vmWithCustomBootSource],
  );

  const template = React.useMemo(
    () => filterTemplates(templates).find((tmp) => tmp.metadata.name === templateName),
    [templateName, templates],
  );

  const [baseImages, imagesLoaded, error] = useBaseImages(template?.variants);

  const loadPVCs = template && !template.isCommon;

  const [pvcs, pvcsLoaded, pvcsError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(
    loadPVCs
      ? {
          kind: PersistentVolumeClaimModel.kind,
          isList: true,
          namespace: templateNs,
        }
      : undefined,
  );

  const dataSourceNS = React.useMemo(
    () => (isUpstream() ? KUBEVIRT_OS_IMAGES_NS : OPENSHIFT_OS_IMAGES_NS),
    [],
  );

  const [dataVolumes, dvLoaded] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: kubevirtReferenceForModel(DataVolumeModel),
    isList: true,
    namespace: dataSourceNS,
  });

  const [dataSources, dataSourcesLoaded] = useK8sWatchResource<DataSourceKind[]>({
    kind: kubevirtReferenceForModel(DataSourceModel),
    isList: true,
    namespace: dataSourceNS,
  });

  React.useEffect(() => {
    if (!selectedTemplate && template) {
      formDispatch({
        type: FORM_ACTION_TYPE.SET_SELECTED_TEMPLATE,
        payload: template.variants[0],
      });
      if (!template.isCommon) {
        formDispatch({
          type: FORM_ACTION_TYPE.SET_PROVIDER,
          payload: getAnnotation(template.variants[0], TEMPLATE_PROVIDER_ANNOTATION),
        });
        if (getAnnotation(template.variants[0], TEMPLATE_SUPPORT_LEVEL) === 'Full') {
          formDispatch({
            type: FORM_ACTION_TYPE.SET_SUPPORT,
            payload: TemplateSupport.FULL_SUPPORT.getValue(),
          });
        }
      }
    }
  }, [selectedTemplate, template]);

  const sourceStatus = getTemplateSourceStatus({
    template: selectedTemplate,
    pvcs: template?.isCommon ? baseImages : pvcs,
    dataVolumes,
    pods: [],
    dataSources,
  });

  const nameValidation = validateVmLikeEntityName(
    name,
    namespace,
    [...templates, ...templatesFromVms],
    {
      // t('kubevirt-plugin~Name is already used by another virtual machine template in this namespace')
      existsErrorMessage:
        'kubevirt-plugin~Name is already used by another virtual machine template in this namespace',
    },
  );

  React.useEffect(() => {
    if (selectedTemplate) {
      const cloudInitVolume = new VMTemplateWrapper(selectedTemplate).getVM().getCloudInitVolume();
      if (cloudInitVolume) {
        const cloudInitData = CloudInitDataHelper.getUserData(cloudInitVolume.cloudInitNoCloud)[0];
        if (injectCloudInit === undefined) {
          formDispatch({
            type: FORM_ACTION_TYPE.INJECT_CLOUD_INIT,
            payload: !!cloudInitData,
          });
        }
        formDispatch({
          type: FORM_ACTION_TYPE.SET_CLOUD_INIT,
          payload: cloudInitData,
        });
      }
    }
  }, [injectCloudInit, selectedTemplate]);

  const flavors = template?.variants
    .sort((a, b) => {
      const aCPU = vCPUCount(getCPU(selectVM(a)));
      const bCPU = vCPUCount(getCPU(selectVM(b)));
      if (aCPU === bCPU) {
        const aMemory = convertToBaseValue(getTemplateMemory(a));
        const bMemory = convertToBaseValue(getTemplateMemory(b));
        return aMemory - bMemory;
      }
      return aCPU - bCPU;
    })
    .reduce((acc, tmp) => {
      const flavor = t(
        'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
        getTemplateFlavorData(tmp),
      );
      acc[flavor] = tmp;
      return acc;
    }, {});

  const submitForm = async () => {
    setVMError(null);
    setCreatingVM(true);
    try {
      const vm = await createVMForCustomization(
        selectedTemplate,
        injectCloudInit ? cloudInit : undefined,
        sourceStatus,
        namespace,
        name,
        `${size.value}${size.unit}`,
        template?.isCommon ? baseImages : pvcs,
        provider,
        support,
        V2VConfigMapImages,
      );
      const vmParams = new URLSearchParams();
      vmParams.append('vm', vm.metadata.name);
      vmParams.append('vmNs', namespace);
      history.push(`/${VIRTUALIZATION_BASE_URL}/customize-source?${vmParams.toString()}`);
    } catch (err) {
      setCreatingVM(false);
      setVMError(err.message);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('kubevirt-plugin~Prepare boot source customization')}</title>
      </Helmet>
      <Grid hasGutter>
        <GridItem className="kv-customize-source">
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h1">
                {t('kubevirt-plugin~Prepare boot source customization')}
              </Title>
            </StackItem>
            <StackItem>
              {t('kubevirt-plugin~Clone boot source, customize it and save it to a new template.')}
            </StackItem>
          </Stack>
        </GridItem>
        <Divider component="div" />
        <GridItem span={6} className="kv-customize-source">
          <StatusBox
            loaded={
              loaded &&
              imagesLoaded &&
              pvcsLoaded &&
              loadvmWithCutomBootSource &&
              V2VConfigMapImagesLoaded &&
              dataSourcesLoaded &&
              dvLoaded
            }
            loadError={loadError || error || pvcsError || vmWithCustomBootSourceError}
            data={selectedTemplate}
          >
            <Stack hasGutter className="kv-customize-source__form-body">
              <StackItem>
                <Form onSubmit={preventDefault}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h2">{t('kubevirt-plugin~Define new template')}</Title>
                    </StackItem>
                    <StackItem className="text-muted">
                      {t(
                        'kubevirt-plugin~Boot source customization will apply to a boot source copy saved on a new template. This template will be a clone of the original boot source template {{templateName}}. The customized boot source will be saved to the new template.',
                        { templateName },
                      )}
                    </StackItem>
                  </Stack>
                  <FormRow
                    fieldId="vmt-namespace"
                    title={t('kubevirt-plugin~New template namespace')}
                    isRequired
                  >
                    <ProjectDropdown
                      onChange={(payload) =>
                        formDispatch({
                          type: FORM_ACTION_TYPE.SET_NAMESPACE,
                          payload,
                        })
                      }
                      project={namespace}
                      id="project-dropdown"
                    />
                  </FormRow>
                  <FormRow
                    fieldId="vmt-name"
                    title={t('kubevirt-plugin~New template name')}
                    isRequired
                    validation={nameValidation}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="vmt-name"
                      name="vmt-name"
                      aria-describedby="vmt-name-helper"
                      value={name}
                      onChange={(payload) =>
                        formDispatch({
                          type: FORM_ACTION_TYPE.SET_NAME,
                          payload,
                        })
                      }
                    />
                  </FormRow>
                  <FormRow
                    fieldId="vmt-provider"
                    title={t('kubevirt-plugin~New template provider')}
                    isRequired
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="vmt-provider"
                      name="vmt-provider"
                      aria-describedby="vmt-provider-helper"
                      value={provider}
                      onChange={(payload) =>
                        formDispatch({
                          type: FORM_ACTION_TYPE.SET_PROVIDER,
                          payload,
                        })
                      }
                    />
                  </FormRow>
                  <FormRow
                    fieldId="vmt-support"
                    title={t('kubevirt-plugin~New template support')}
                    isRequired
                  >
                    <FormPFSelect
                      id="vmt-support"
                      onSelect={(e, v) => {
                        formDispatch({
                          type: FORM_ACTION_TYPE.SET_SUPPORT,
                          payload: v.toString(),
                        });
                      }}
                      selections={[t(TemplateSupport.fromString(support).toString())]}
                    >
                      {TemplateSupport.getAll().map((templateSupport) => (
                        <SelectOption
                          key={templateSupport.getValue()}
                          value={templateSupport.getValue()}
                        >
                          {t(templateSupport.toString())}
                        </SelectOption>
                      ))}
                    </FormPFSelect>
                  </FormRow>
                  {template?.variants.length > 1 && (
                    <FormRow
                      fieldId="vmt-flavor"
                      title={t('kubevirt-plugin~New template flavor')}
                      isRequired
                    >
                      <FormPFSelect
                        toggleId="vmt-flavor-select"
                        variant={SelectVariant.single}
                        selections={[
                          t(
                            'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
                            getTemplateFlavorData(selectedTemplate),
                          ),
                        ]}
                        onSelect={(e, f: string) =>
                          formDispatch({
                            type: FORM_ACTION_TYPE.SET_SELECTED_TEMPLATE,
                            payload: flavors[f],
                          })
                        }
                        isCheckboxSelectionBadgeHidden
                      >
                        {Object.keys(flavors).map((flavor) => (
                          <SelectOption key={flavor} value={flavor} />
                        ))}
                      </FormPFSelect>
                    </FormRow>
                  )}
                  <Divider />
                  <Title headingLevel="h2">
                    {t('kubevirt-plugin~Prepare boot source for customization')}
                  </Title>
                  {template?.isCommon &&
                    !isTemplateSourceError(sourceStatus) &&
                    sourceStatus?.isCDRom && (
                      <FormRow
                        fieldId="vmt-pvc-size"
                        title={t('kubevirt-plugin~Persistent Volume Claim size')}
                        isRequired
                      >
                        <RequestSizeInput
                          name="requestSize"
                          required
                          onChange={(payload) =>
                            formDispatch({
                              type: FORM_ACTION_TYPE.SET_SIZE,
                              payload,
                            })
                          }
                          defaultRequestSizeUnit={size.unit}
                          defaultRequestSizeValue={size.value}
                          dropdownUnits={dropdownUnits}
                          describedBy="request-size-help"
                          inputID="request-size-input"
                        >
                          <div className="pf-c-form__helper-text" aria-live="polite">
                            {t(
                              'kubevirt-plugin~This boot source is marked as CD-ROM, and requires allocated resources (disk) to customize it. Please allocate a PersistentVolumeClaim for the customization process.',
                            )}
                          </div>
                        </RequestSizeInput>
                      </FormRow>
                    )}
                  <Checkbox
                    label="Inject cloud-init"
                    isChecked={injectCloudInit}
                    data-checked-state={injectCloudInit}
                    onChange={(payload) =>
                      formDispatch({
                        type: FORM_ACTION_TYPE.INJECT_CLOUD_INIT,
                        payload,
                      })
                    }
                    aria-label="inject cloud init"
                    id="vmt-cloud-init-check"
                  />
                  {injectCloudInit && (
                    <>
                      <TextArea
                        className="kv-customize-source__cloud-init"
                        value={cloudInit}
                        onChange={(payload) =>
                          formDispatch({
                            type: FORM_ACTION_TYPE.SET_CLOUD_INIT,
                            payload,
                          })
                        }
                        resizeOrientation="vertical"
                      />
                      <div className="pf-c-form__helper-text" aria-live="polite">
                        {t('kubevirt-plugin~This script will run against the boot source.')}
                      </div>
                    </>
                  )}
                </Form>
              </StackItem>
              {vmError && (
                <StackItem>
                  <Alert isInline variant="danger" title="Error occured">
                    {vmError}
                  </Alert>
                </StackItem>
              )}
            </Stack>
            <ActionGroup className="pf-c-form kv-customize-source__footer">
              <Button
                data-test="start-customize"
                isDisabled={creatingVM || !namespace || !name || !!nameValidation || !provider}
                onClick={submitForm}
              >
                {t('kubevirt-plugin~Start customization')}
              </Button>
              <Button isDisabled={creatingVM} onClick={history.goBack} variant="secondary">
                {t('kubevirt-plugin~Cancel')}
              </Button>
            </ActionGroup>
          </StatusBox>
        </GridItem>
      </Grid>
    </>
  );
};

export default CustomizeSourceForm;
