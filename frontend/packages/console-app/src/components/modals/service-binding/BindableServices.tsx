import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { FirehoseResource } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForGroupVersionKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager/src';
import { ResourceDropdownField, getFieldId } from '@console/shared';
import { getBindableResources } from './bindable-services-utils';

export type OwnedResourceType = {
  displayName: string;
  kind: string;
  name: string;
  version: string;
};

type BindableServiceProps = {
  resource: K8sResourceKind;
};

const BindableServices: React.FC<BindableServiceProps> = ({ resource }) => {
  const { t } = useTranslation();
  const { setFieldValue, setFieldTouched, setStatus } = useFormikContext<FormikValues>();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const { group, version, kind } = getGroupVersionKindForModel(ClusterServiceVersionModel);
  const watchedResources = {
    csvs: {
      isList: true,
      kind: referenceForGroupVersionKind(group, version, kind),
      namespace: resource.metadata.namespace,
      optional: true,
    },
  };
  const csvResources = useK8sWatchResources<{ csvs: ClusterServiceVersionKind[] }>(
    watchedResources,
  );
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

  const dropdownResources = React.useMemo(
    () => getBindableResources(resource.metadata.namespace, csvResources?.csvs),
    [csvResources, resource.metadata.namespace],
  );
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
