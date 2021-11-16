import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { FormikProps, FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FormFooter,
  FlexForm,
  useFormikValidationFix,
  FormBody,
  YAMLEditorField,
  SyncedEditorField,
} from '@console/shared';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import {
  isDefaultChannel,
  getChannelKind,
  getChannelData,
  useDefaultChannelConfiguration,
  getCatalogChannelData,
  channelYamltoFormData,
} from '../../../utils/create-channel-utils';
import { AddChannelFormData, ChannelListProps, YamlFormSyncData } from '../import-types';
import ChannelSelector from './form-fields/ChannelSelector';
import FormViewSection from './sections/FormViewSection';

interface OwnProps {
  namespace: string;
  channels: ChannelListProps;
}

const ChannelForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  namespace,
  channels,
}) => {
  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'knative.channelForm.editor.lastView';
  const {
    values,
    setFieldValue,
    setFieldTouched,
    validateForm,
    setErrors,
    setStatus,
  } = useFormikContext<FormikValues>();
  const { t } = useTranslation();
  useFormikValidationFix(values);
  const [defaultConfiguredChannel, defaultConfiguredChannelLoaded] = useDefaultChannelConfiguration(
    namespace,
  );
  // const channelHasFormView = values.type && isDefaultChannel(getChannelKind(values.type));
  const channelKind = getChannelKind(values.formData.type);
  const onTypeChange = React.useCallback(
    (item: string) => {
      setErrors({});
      setStatus({});
      const kind = getChannelKind(item);
      if (isDefaultChannel(kind)) {
        const nameData = `formData.data.${kind.toLowerCase()}`;
        const sourceData = getChannelData(kind.toLowerCase());
        setFieldValue(nameData, sourceData);
        setFieldTouched(nameData, true);
      }

      setFieldValue('formData.type', item);
      setFieldTouched('formData.type', true);

      setFieldValue('formData.name', _.kebabCase(`${kind}`));
      setFieldTouched('formData.name', true);
      validateForm();
    },
    [setErrors, setStatus, setFieldValue, setFieldTouched, validateForm],
  );

  const sanitizeToYaml = () => {
    return safeJSToYAML(
      getCatalogChannelData(values as YamlFormSyncData<AddChannelFormData>),
      'yamlData',
      {
        skipInvalid: true,
        noRefs: true,
      },
    );
  };

  const yamlEditor = <YAMLEditorField name="yamlData" showSamples onSave={handleSubmit} />;

  const formEditor = <FormViewSection namespace={namespace} kind={channelKind} />;

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        {((channels && !channels.loaded) || !defaultConfiguredChannelLoaded) && <LoadingInline />}
        {channels &&
          channels.loaded &&
          defaultConfiguredChannelLoaded &&
          !_.isEmpty(channels.channelList) && (
            <>
              <ChannelSelector
                channels={channels.channelList}
                onChange={onTypeChange}
                defaultConfiguredChannel={defaultConfiguredChannel}
              />
              <SyncedEditorField
                name="editorType"
                formContext={{
                  name: 'formData',
                  editor: formEditor,
                  sanitizeTo: (formData: K8sResourceKind) =>
                    channelYamltoFormData(formData, values.formData),
                }}
                yamlContext={{ name: 'yamlData', editor: yamlEditor, sanitizeTo: sanitizeToYaml }}
                lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
              />
            </>
          )}
        {channels && channels.loaded && _.isEmpty(channels.channelList) && (
          <Alert variant="default" title={t('knative-plugin~Channel cannot be created')} isInline>
            {t('knative-plugin~You do not have write access in this project.')}
          </Alert>
        )}
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('knative-plugin~Create')}
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('knative-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default ChannelForm;
