import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getBindableServiceResources } from '@console/dev-console/src/components/topology/bindable-services/bindable-service-resources';
import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceDropdownField, getFieldId } from '@console/shared';

export const bindableResources = (namespace: string) => {
  const bindableRes = _.omit(getBindableServiceResources(namespace), 'serviceBindingRequests');

  const res = Object.keys(bindableRes).map((key) => bindableRes[key]);
  return res;
};

type BindableServiceProps = {
  resource: K8sResourceKind;
};

const BindableServices: React.FC<BindableServiceProps> = ({ resource }) => {
  const { t } = useTranslation();
  const { setFieldValue, setFieldTouched, setStatus } = useFormikContext<FormikValues>();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const onServiceChange = React.useCallback(
    (selectedValue, name, obj) => {
      if (!_.isEmpty(obj)) {
        setFieldTouched('service', true);
        setFieldValue('bindableService', obj);
        setStatus({ submitError: null });
      }
    },
    [setFieldTouched, setFieldValue, setStatus],
  );

  React.useEffect(() => {
    setStatus({ subscriberAvailable: !resourceAlert });
  }, [resourceAlert, setStatus]);

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    setResourceAlert(_.isEmpty(resourceList));
  };

  const dropdownResources = bindableResources(resource.metadata.namespace);
  return (
    <FormGroup
      fieldId={getFieldId('bindable-service', 'dropdown')}
      label={t('console-app~Bindable service')}
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title={t('console-app~No bindable services available')} isInline>
            {t('console-app~To create a Service binding, first create a bindable service.')}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="service"
        resources={dropdownResources as FirehoseResource[]}
        dataSelector={['metadata', 'name']}
        fullWidth
        required
        placeholder={t('console-app~Select Service')}
        showBadge
        autocompleteFilter={autocompleteFilter}
        onChange={onServiceChange}
        autoSelect
        disabled={resourceAlert}
        onLoad={handleOnLoad}
      />
    </FormGroup>
  );
};

export default BindableServices;
