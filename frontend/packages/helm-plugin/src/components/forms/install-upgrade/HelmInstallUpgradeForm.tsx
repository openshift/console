import type { ReactNode, FC } from 'react';
import { useMemo, useState } from 'react';
import { TextInputTypes, Grid, GridItem, Button, Alert } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import * as fuzzy from 'fuzzysearch';
import type { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getJSONSchemaOrder, prune } from '@console/shared/src/components/dynamic-form/utils';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { FormHeader } from '@console/shared/src/components/form-utils/FormHeader';
import { CodeEditorField } from '@console/shared/src/components/formik-fields/CodeEditorField';
import { DynamicFormField } from '@console/shared/src/components/formik-fields/DynamicFormField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import { SyncedEditorField } from '@console/shared/src/components/formik-fields/SyncedEditorField';
import type { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import type { HelmChart, HelmActionConfigType } from '../../../types/helm-types';
import { HelmActionType } from '../../../types/helm-types';
import { helmActionString } from '../../../utils/helm-utils';
import { useHelmCreateBasicAuthSecretModal } from '../url-chart/HelmCreateBasicAuthSecretModal';
import { useSecretResources } from '../url-chart/useSecretResources';
import HelmChartVersionDropdown from './HelmChartVersionDropdown';
import { useHelmReadmeModalLauncher } from './HelmReadmeModal';

export type HelmInstallUpgradeFormData = {
  releaseName: string;
  chartURL?: string;
  chartName: string;
  chartIndexEntry?: string;
  chartRepoName: string;
  chartVersion: string;
  chartReadme: string;
  appVersion: string;
  yamlData: string;
  formData: any;
  formSchema: JSONSchema7;
  editorType: EditorType;
  basicAuthSecretName?: string;
  isURLInstall?: boolean;
};

interface HelmInstallUpgradeFormProps {
  chartHasValues: boolean;
  helmActionConfig: HelmActionConfigType;
  chartMetaDescription: ReactNode;
  onVersionChange: (chart: HelmChart) => void;
  chartError: Error;
  namespace: string;
  chartIndexEntry?: string;
  annotatedName?: string;
  providerName?: string;
}

const HelmInstallUpgradeForm: FC<
  FormikProps<HelmInstallUpgradeFormData> & HelmInstallUpgradeFormProps
> = ({
  chartHasValues,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  helmActionConfig,
  values,
  dirty,
  chartMetaDescription,
  onVersionChange,
  chartError,
  namespace,
  chartIndexEntry,
  annotatedName,
  providerName,
  setFieldValue,
}) => {
  const { t } = useTranslation('helm-plugin');
  const launchHelmCreateBasicAuthSecretModal = useHelmCreateBasicAuthSecretModal();
  const [isCreateSecretModalOpen, setIsCreateSecretModalOpen] = useState(false);

  const CREATE_SECRET_KEY = 'create-secret';
  const NONE_SECRET_KEY = '__none__';

  const handleSecretSave = (name: string) => {
    setFieldValue('basicAuthSecretName', name);
  };

  const handleSecretChange = (key: string) => {
    if (key === NONE_SECRET_KEY) {
      window.setTimeout(() => setFieldValue('basicAuthSecretName', NONE_SECRET_KEY), 0);
      return;
    }
    if (key === CREATE_SECRET_KEY && !isCreateSecretModalOpen) {
      // ResourceDropdownField writes the selected key to form state after this callback.
      // Defer restoring the previous secret so "create-secret" is not persisted.
      window.setTimeout(
        () => setFieldValue('basicAuthSecretName', values.basicAuthSecretName || ''),
        0,
      );
      setIsCreateSecretModalOpen(true);
      launchHelmCreateBasicAuthSecretModal({
        namespace,
        save: (name) => {
          handleSecretSave(name);
          setIsCreateSecretModalOpen(false);
        },
        onClose: () => setIsCreateSecretModalOpen(false),
      });
    }
  };
  const { chartName, chartVersion, chartReadme, formData, formSchema, editorType } = values;
  const { type: helmAction, title, subTitle } = helmActionConfig;
  const helmReadmeModalLauncher = useHelmReadmeModalLauncher({ readme: chartReadme });
  const showAuthSecret = values.isURLInstall;
  const secretResources = useSecretResources(namespace);
  const autocompleteFilter = (strText: string, item: any): boolean =>
    fuzzy(strText, item?.props?.name);
  const secretMissing = useMemo(() => {
    if (
      !showAuthSecret ||
      !values.basicAuthSecretName ||
      values.basicAuthSecretName === NONE_SECRET_KEY ||
      !secretResources[0]?.loaded
    ) {
      return false;
    }
    const secrets = secretResources[0].data ?? [];
    return !secrets.some((s) => s.metadata.name === values.basicAuthSecretName);
  }, [showAuthSecret, secretResources, values.basicAuthSecretName]);
  const isSubmitDisabled =
    (helmAction === HelmActionType.Upgrade && !dirty) ||
    isSubmitting ||
    !_.isEmpty(errors) ||
    !!chartError;

  const uiSchema = useMemo(() => getJSONSchemaOrder(formSchema, {}), [formSchema]);

  const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY = 'helm.installUgradeForm.editor.lastView';

  const formEditor = formData && formSchema && (
    <DynamicFormField
      name="formData"
      schema={formSchema}
      uiSchema={uiSchema}
      formDescription={chartMetaDescription}
    />
  );

  const yamlEditor = chartHasValues && (
    <CodeEditorField
      name="yamlData"
      label={t('Helm release')}
      schema={formSchema}
      showSamples={false}
      onSave={handleSubmit}
    />
  );

  const formSubTitle = _.isString(subTitle) ? subTitle : subTitle?.[editorType];

  const readmeText = chartReadme && (
    <Trans t={t} ns="helm-plugin">
      For more information on the chart, refer to this{' '}
      <Button
        type="button"
        variant="link"
        data-test-id="helm-readme-modal"
        onClick={helmReadmeModalLauncher}
        isInline
      >
        README
      </Button>
    </Trans>
  );

  const formHelpText = (
    <>
      {chartHasValues && <>{formSubTitle} &nbsp;</>}
      {readmeText}
    </>
  );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader title={title} helpText={formHelpText} marginBottom="lg" />
        {chartError && (
          <Alert variant="danger" isInline title={t('You cannot install the Helm Chart.')}>
            {t('The Helm Chart is currently unavailable. {{chartError}}', {
              chartError,
            })}
          </Alert>
        )}
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem xl={7} lg={8} md={12}>
              <InputField
                type={TextInputTypes.text}
                name="releaseName"
                label={t('Release name')}
                helpText={t('A unique name for the Helm release.')}
                required
                isDisabled={!!chartError || helmAction === HelmActionType.Upgrade}
                data-test="release-name"
              />
            </GridItem>
            <GridItem xl={5} lg={4} md={12}>
              <HelmChartVersionDropdown
                chartName={chartName}
                chartVersion={chartVersion}
                helmAction={helmAction}
                onVersionChange={onVersionChange}
                namespace={namespace}
                chartIndexEntry={chartIndexEntry}
                annotatedName={annotatedName}
                providerName={providerName}
              />
            </GridItem>
            {showAuthSecret && (
              <GridItem xl={5} lg={4} md={12}>
                <ResourceDropdownField
                  name="basicAuthSecretName"
                  label={t('Secret for Basic authentication')}
                  resources={secretResources}
                  dataSelector={['metadata', 'name']}
                  fullWidth
                  placeholder={
                    helmAction === HelmActionType.Upgrade ? t('None') : t('Select a secret')
                  }
                  showBadge
                  autocompleteFilter={autocompleteFilter}
                  actionItems={[
                    {
                      actionTitle: t('None'),
                      actionKey: NONE_SECRET_KEY,
                    },
                    {
                      actionTitle: t('Create authentication secret'),
                      actionKey: CREATE_SECRET_KEY,
                    },
                  ]}
                  onChange={handleSecretChange}
                  helpText={t(
                    'A secret with "username" and "password" keys for OCI/HTTP(S) authentication.',
                  )}
                />
                {secretMissing && (
                  <Alert
                    variant="warning"
                    isInline
                    isPlain
                    title={t(
                      'Secret "{{secretName}}" was not found in this namespace. Select an existing secret or create a new one.',
                      { secretName: values.basicAuthSecretName },
                    )}
                  />
                )}
              </GridItem>
            )}
          </Grid>
        </FormSection>
        {!chartError &&
          (!formSchema && !chartHasValues ? (
            <Alert
              variant="info"
              title={t(
                "Helm release is not configurable since the Helm Chart doesn't define any values.",
              )}
              isInline
            />
          ) : (
            <SyncedEditorField
              name="editorType"
              formContext={{ name: 'formData', editor: formEditor, isDisabled: !formSchema }}
              yamlContext={{ name: 'yamlData', editor: yamlEditor }}
              lastViewUserPreferenceKey={LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY}
              prune={prune}
              noMargin
            />
          ))}
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={helmActionString(t)[helmAction]}
        disableSubmit={isSubmitDisabled}
        resetLabel={t('Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
