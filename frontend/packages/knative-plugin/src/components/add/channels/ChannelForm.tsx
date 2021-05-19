import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { FormikProps, FormikValues, useFormikContext } from 'formik';
import { FormFooter, FlexForm, useFormikValidationFix, FormBody } from '@console/shared';
import { LoadingInline } from '@console/internal/components/utils';
import {
  isDefaultChannel,
  getChannelKind,
  getChannelData,
  useDefaultChannelConfiguration,
} from '../../../utils/create-channel-utils';
import { ChannelListProps } from '../import-types';
import FormViewSection from './sections/FormViewSection';
import ChannelSelector from './form-fields/ChannelSelector';
import ChannelYamlEditor from './form-fields/ChannelYamlEditor';
import { useTranslation } from 'react-i18next';

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
  const channelHasFormView = values.type && isDefaultChannel(getChannelKind(values.type));
  const channelKind = getChannelKind(values.type);
  const onTypeChange = React.useCallback(
    (item: string) => {
      setErrors({});
      setStatus({});
      const kind = getChannelKind(item);
      if (isDefaultChannel(kind)) {
        const nameData = `data.${kind.toLowerCase()}`;
        const sourceData = getChannelData(kind.toLowerCase());
        setFieldValue(nameData, sourceData);
        setFieldTouched(nameData, true);
        setFieldValue('yamlData', '');
        setFieldTouched('yamlData', true);
      }

      setFieldValue('type', item);
      setFieldTouched('type', true);

      setFieldValue('name', _.kebabCase(`${kind}`));
      setFieldTouched('name', true);
      validateForm();
    },
    [setErrors, setStatus, setFieldValue, setFieldTouched, validateForm],
  );

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
              {channelHasFormView && <FormViewSection namespace={namespace} kind={channelKind} />}
              {!channelHasFormView && <ChannelYamlEditor />}
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
