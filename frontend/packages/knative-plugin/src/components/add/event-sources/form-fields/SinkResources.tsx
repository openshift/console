import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import { getDynamicChannelResourceList } from '../../../../utils/fetch-dynamic-eventsources-utils';
import {
  knativeServingResourcesServices,
  knativeEventingResourcesBroker,
  k8sServices,
} from '../../../../utils/get-knative-resources';
import { craftResourceKey } from '../../../pub-sub/pub-sub-utils';
import { SinkType } from '../../import-types';

import './SinkResources.scss';

export interface SinkResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SinkResources: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const [, { touched: sinkTypeTouched }] = useField('formData.sinkType');
  const autocompleteFilter = (strText: string, item: React.ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup = 'core', apiVersion, kind } = modelData;
        setFieldValue('formData.sink.name', name);
        setFieldTouched('formData.sink.name', true);
        setFieldValue('formData.sink.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('formData.sink.apiVersion', true);
        setFieldValue('formData.sink.kind', kind);
        setFieldTouched('formData.sink.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.formData.sink.name;
  const resourcesData = [
    ...k8sServices(namespace),
    ...knativeServingResourcesServices(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (isEmpty(resourceList)) {
      setResourceAlert(true);
      if (!sinkTypeTouched) {
        setFieldValue('formData.sinkType', SinkType.Uri);
        setFieldTouched('formData.sinkType', true);
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
          ? t('knative-plugin~This resource will be the sink for the Event source.')
          : ''
      }
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title={t('knative-plugin~No resources available')} isInline>
            {t(
              'knative-plugin~Select the URI option, or exit this form and create a Knative Service, Broker, or Channel first.',
            )}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        menuClassName={'max-height-menu'}
        data-test="sinkable-resources"
        name="formData.sink.key"
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

export default SinkResources;
