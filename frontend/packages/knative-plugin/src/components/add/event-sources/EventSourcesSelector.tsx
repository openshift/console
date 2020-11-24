import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { NormalizedEventSources } from '../import-types';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceModels } from '../../../utils/fetch-dynamic-eventsources-utils';
import { isKnownEventSource, getEventSourceData } from '../../../utils/create-eventsources-utils';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const { t } = useTranslation();
  const eventSourceItems = Object.keys(eventSourceList).length;
  const {
    values: {
      formData: { type },
    },
    setFieldValue,
    setFieldTouched,
    validateForm,
    setErrors,
    setStatus,
  } = useFormikContext<FormikValues>();

  const handleItemChange = React.useCallback(
    (item: string) => {
      if (item !== type) {
        setErrors({});
        setStatus({});
        if (isKnownEventSource(item)) {
          const nameData = `formData.data.${item}`;
          const sourceData = getEventSourceData(item);
          setFieldValue(nameData, sourceData);
          setFieldTouched(nameData, true);
          setFieldValue('editorType', EditorType.Form);
          setFieldTouched('editorType', true);
        } else {
          setFieldValue('editorType', EditorType.YAML);
          setFieldTouched('editorType', true);
        }
        setFieldValue('formData.data.itemData', eventSourceList[item]);
        const selDataModel = _.find(getEventSourceModels(), { kind: item });
        const selApiVersion = selDataModel
          ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
          : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha1`;
        const name = _.kebabCase(item);
        setFieldValue('formData.name', name);
        setFieldTouched('formData.name', true);
        setFieldValue('formData.apiVersion', selApiVersion);
        setFieldTouched('formData.apiVersion', true);
        validateForm();
      }
    },
    [type, setErrors, setStatus, setFieldValue, eventSourceList, setFieldTouched, validateForm],
  );

  return (
    <FormSection title={t('knative-plugin~Type')} fullWidth extraMargin>
      <ItemSelectorField
        itemList={eventSourceList}
        loadingItems={!eventSourceItems}
        name="formData.type"
        onSelect={handleItemChange}
        showIfSingle
        showFilter
        showCount
        emptyStateMessage={t(
          'knative-plugin~No Event Source types are being shown due to the filters being applied.',
        )}
      />
    </FormSection>
  );
};

export default EventSourcesSelector;
