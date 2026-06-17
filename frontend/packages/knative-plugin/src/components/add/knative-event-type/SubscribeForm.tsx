import type { FC } from 'react';
import { useState } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import SwitchToYAMLAlert from '@console/shared/src/components/alerts/SwitchToYAMLAlert';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { CodeEditorField } from '@console/shared/src/components/formik-fields/CodeEditorField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { SyncedEditorField } from '@console/shared/src/components/formik-fields/SyncedEditorField';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import {
  EventingBrokerModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
} from '../../../models';
import PubSubFilter from '../../pub-sub/form-fields/PubSubFilter';
import PubSubSubscriber from '../../pub-sub/form-fields/PubSubSubscriber';
import { convertFormToTriggerYaml, convertYamlToForm } from './subscribe-utils';

interface SubscribeFormProps {
  filterEnabled: boolean;
  source: K8sResourceKind;
  handleCancel?: () => void;
}

type Props = FormikProps<FormikValues> & SubscribeFormProps;

const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY = 'knative.addSubscriberForm.editor.lastView';

const SubscribeForm: FC<Props> = ({
  filterEnabled,
  handleSubmit,
  handleCancel,
  isSubmitting,
  status,
  source,
  errors,
  values,
}) => {
  const { t } = useTranslation('knative-plugin');
  const [showYAMLAlert, setShowYAMLAlert] = useState<boolean>(true);
  const { kind: sourceKind } = source;
  const dirty = values?.formData?.metadata?.name && values?.formData?.spec?.subscriber?.ref?.name;
  const getResourceModel = () =>
    sourceKind === EventingBrokerModel.kind ? EventingTriggerModel : EventingSubscriptionModel;

  const sanitizeToForm = (yamlbuild) => {
    return convertYamlToForm(yamlbuild, values).formData;
  };

  const sanitizeToYaml = () => {
    return safeJSToYAML(convertFormToTriggerYaml(values), '', {
      skipInvalid: true,
    });
  };

  const formEditor = (
    <>
      {showYAMLAlert && <SwitchToYAMLAlert onClose={() => setShowYAMLAlert(false)} />}
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name="formData.metadata.name"
          label={t('Name')}
          required
        />
        <PubSubSubscriber autoSelect={false} />
        {filterEnabled && <PubSubFilter />}
      </FormSection>
    </>
  );

  const yamlEditor = (
    <CodeEditorField name="yamlData" model={getResourceModel()} showSamples onSave={handleSubmit} />
  );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <SyncedEditorField
          name="editorType"
          formContext={{
            name: 'formData',
            editor: formEditor,
            sanitizeTo: sanitizeToForm,
          }}
          yamlContext={{
            name: 'yamlData',
            editor: yamlEditor,
            sanitizeTo: sanitizeToYaml,
          }}
          lastViewUserPreferenceKey={LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY}
          noMargin
        />
      </FormBody>
      <FormFooter
        isSubmitting={isSubmitting}
        submitLabel={t('Subscribe')}
        cancelLabel={t('Cancel')}
        disableSubmit={
          (values.editorType !== EditorType.YAML ? !dirty || !_.isEmpty(errors) : false) ||
          isSubmitting
        }
        handleCancel={handleCancel}
        errorMessage={status.error}
        handleDownload={
          values.editorType === EditorType.YAML && (() => downloadYaml(values.yamlData))
        }
        sticky
      />
    </FlexForm>
  );
};

export default SubscribeForm;
