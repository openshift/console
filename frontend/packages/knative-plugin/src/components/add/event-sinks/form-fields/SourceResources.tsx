import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import {
  getDynamicChannelResourceList,
  getDynamicEventSourcesResourceList,
} from '../../../../utils/fetch-dynamic-eventsources-utils';
import { knativeEventingResourcesBroker } from '../../../../utils/get-knative-resources';
import { craftResourceKey } from '../../../pub-sub/pub-sub-utils';
import { SinkType } from '../../import-types';

export interface SourceResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SourceResources: React.FC<SourceResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const [, { touched: sinkTypeTouched }] = useField('formData.sourceType');
  const autocompleteFilter = (strText: string, item: React.ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('source-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup = 'core', apiVersion, kind } = modelData;
        setFieldValue('formData.source.name', name);
        setFieldTouched('formData.source.name', true);
        setFieldValue('formData.source.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('formData.source.apiVersion', true);
        setFieldValue('formData.source.kind', kind);
        setFieldTouched('formData.source.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.formData.source.name;
  const resourcesData = [
    ...getDynamicEventSourcesResourceList(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (isEmpty(resourceList)) {
      setResourceAlert(true);
      if (!sinkTypeTouched) {
        setFieldValue('formData.sourceType', SinkType.Uri);
        setFieldTouched('formData.sourceType', true);
      }
    } else {
      setResourceAlert(false);
    }
  };

  // filter out resource which are owned by other resource
  const resourceFilter = ({ metadata }: K8sResourceKind) => !metadata?.ownerReferences?.length;

  return (
    <FormGroup
      fieldId={fieldId}
      helperText={
        !contextAvailable
          ? t('knative-plugin~This resource will be the source for the Event sink.')
          : ''
      }
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title={t('knative-plugin~No resources available')} isInline>
            {t(
              'knative-plugin~Select the URI option, or exit this form and create an Event source, Broker, or Channel first.',
            )}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        menuClassName={'max-height-menu'}
        data-test="sourcable-resources"
        name="formData.source.key"
        resources={resourcesData}
        dataSelector={['metadata', 'name']}
        fullWidth
        placeholder={t('knative-plugin~Select resource')}
        showBadge
        disabled={contextAvailable || resourceAlert}
        onChange={onChange}
        autocompleteFilter={autocompleteFilter}
        autoSelect
        customResourceKey={craftResourceKey}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
      />
    </FormGroup>
  );
};

export default SourceResources;
