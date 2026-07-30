import type { FC } from 'react';
import { useMemo } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import type { HelmChartRepositoryType } from '@console/helm-plugin/src/types/helm-types';
import { ExpandCollapse } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { RadioGroupField } from '@console/shared/src/components/formik-fields/RadioGroupField';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';

type CreateHelmChartRepositoryFormEditorProps = {
  showScopeType: boolean;
  existingRepo: HelmChartRepositoryType;
  namespace: string;
};

const CreateHelmChartRepositoryFormEditor: FC<CreateHelmChartRepositoryFormEditorProps> = ({
  showScopeType,
  existingRepo,
  namespace,
}) => {
  const { t } = useTranslation('helm-plugin');
  const {
    values: { formData },
  } = useFormikContext<FormikValues>();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const isProjectScoped =
    formData.scope === 'ProjectHelmChartRepository' ||
    existingRepo?.kind === 'ProjectHelmChartRepository';

  const resourceNamespace = isProjectScoped ? namespace : 'openshift-config';

  const watchedResources = useK8sWatchResources<{
    configMaps: K8sResourceKind[];
    secrets: K8sResourceKind[];
  }>({
    configMaps: {
      isList: true,
      kind: ConfigMapModel.kind,
      namespace: resourceNamespace,
      optional: true,
    },
    secrets: {
      isList: true,
      kind: SecretModel.kind,
      namespace: resourceNamespace,
      optional: true,
    },
  });

  const configMapResources = useMemo(
    () => [
      {
        data: watchedResources.configMaps?.data,
        loaded: watchedResources.configMaps?.loaded,
        loadError: watchedResources.configMaps?.loadError,
        kind: ConfigMapModel.kind,
      },
    ],
    [
      watchedResources.configMaps?.data,
      watchedResources.configMaps?.loaded,
      watchedResources.configMaps?.loadError,
    ],
  );

  const secretResources = useMemo(
    () => [
      {
        data: watchedResources.secrets?.data,
        loaded: watchedResources.secrets?.loaded,
        loadError: watchedResources.secrets?.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets?.data,
      watchedResources.secrets?.loaded,
      watchedResources.secrets?.loadError,
    ],
  );

  return (
    <FormSection>
      {showScopeType && !existingRepo && (
        <RadioGroupField
          name="formData.scope"
          label={t('Scope type')}
          options={[
            {
              label: t('Namespaced scoped  (ProjectHelmChartRepository)'),
              value: 'ProjectHelmChartRepository',
              children: t('Add Helm Chart Repository in the selected namespace.'),
              isChecked: formData.scope === 'ProjectHelmChartRepository',
            },
            {
              label: t('Cluster scoped (HelmChartRepository)'),
              value: 'HelmChartRepository',
              children: t('Add Helm Chart Repository at the cluster level and in all namespaces.'),
              isChecked: formData.scope === 'HelmChartRepository',
            },
          ]}
        />
      )}
      <InputField
        type={TextInputTypes.text}
        name="formData.repoName"
        label={t('Name')}
        helpText={!existingRepo ? t('A unique name for the Helm Chart repository.') : null}
        isDisabled={!!existingRepo}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name="formData.repoDisplayName"
        label={t('Display name')}
        helpText={t('A display name for the Helm Chart repository.')}
      />
      <InputField
        type={TextInputTypes.text}
        name="formData.repoDescription"
        label={t('Description')}
        helpText={t('A description for the Helm Chart repository.')}
      />
      <CheckboxField
        name="formData.disabled"
        label={t('Disable usage of the repo in the Software Catalog.')}
      />
      <InputField
        type={TextInputTypes.text}
        name="formData.repoUrl"
        label={t('URL')}
        helpText={t('Helm Chart repository URL.')}
        required
      />
      <ExpandCollapse
        textExpanded={t('Hide advanced options')}
        textCollapsed={t('Show advanced options')}
      >
        <FormSection>
          <p className="pf-v6-c-form__helper-text">
            {t(
              'Add credentials and custom certificate authority (CA) certificates to connect to private helm chart repository.',
            )}
          </p>
          <ResourceDropdownField
            name="formData.ca"
            label={t('CA certificate')}
            resources={configMapResources}
            dataSelector={['metadata', 'name']}
            fullWidth
            placeholder={t('Select ConfigMap')}
            showBadge
            autocompleteFilter={autocompleteFilter}
          />

          <ResourceDropdownField
            name="formData.tlsClientConfig"
            label={t('TLS Client config')}
            resources={secretResources}
            dataSelector={['metadata', 'name']}
            fullWidth
            placeholder={t('Select Secret')}
            showBadge
            autocompleteFilter={autocompleteFilter}
          />

          {isProjectScoped && (
            <ResourceDropdownField
              name="formData.basicAuthConfig"
              label={t('Basic authentication')}
              resources={secretResources}
              dataSelector={['metadata', 'name']}
              fullWidth
              placeholder={t('Select Secret')}
              showBadge
              autocompleteFilter={autocompleteFilter}
            />
          )}
        </FormSection>
      </ExpandCollapse>
    </FormSection>
  );
};

export default CreateHelmChartRepositoryFormEditor;
