import * as React from 'react';
import {
  FormGroup,
  Alert,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import { getDynamicChannelResourceList } from '../../../../utils/fetch-dynamic-eventsources-utils';
import { knativeEventingResourcesBroker } from '../../../../utils/get-knative-resources';
import { craftResourceKey } from '../../../pub-sub/pub-sub-utils';

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

  const resourcesData = [
    ...(getDynamicChannelResourceList(namespace) ?? []),
    ...knativeEventingResourcesBroker(namespace),
  ];

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

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (isEmpty(resourceList)) {
      setResourceAlert(true);
    } else {
      setResourceAlert(false);
    }
  };

  // filter out resource which are owned by other resource
  const resourceFilter = ({ metadata }: K8sResourceKind) => !metadata?.ownerReferences?.length;

  return (
    <FormGroup fieldId={fieldId} isRequired>
      {resourceAlert && (
        <>
          <Alert variant="custom" title={t('knative-plugin~No resources available')} isInline>
            {t('knative-plugin~Exit this form and create a Broker, or Channel first.')}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        key={resourcesData.length === 0 ? 'no-resources' : 'resources'}
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
        customResourceKey={craftResourceKey as any}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
      />

      {!contextAvailable && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t('knative-plugin~This resource will be the source for the Event sink.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default SourceResources;
