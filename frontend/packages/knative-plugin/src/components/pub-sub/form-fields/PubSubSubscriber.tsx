import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceDropdownField, getFieldId } from '@console/shared';
import { getSinkableResources } from '../../../utils/get-knative-resources';
import { craftResourceKey } from '../pub-sub-utils';

type PubSubSubscriberProps = {
  autoSelect?: boolean;
  cancel?: () => void;
};

const PubSubSubscriber: React.FC<PubSubSubscriberProps> = ({ autoSelect = true, cancel }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched, validateForm, setStatus } = useFormikContext<
    FormikValues
  >();
  const { namespace } = values.formData.metadata;
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const onSubscriberChange = React.useCallback(
    (selectedValue, target) => {
      const modelResource = target?.props?.model;
      if (selectedValue) {
        setFieldTouched('formData.spec.subscriber.ref.name', true);
        setFieldValue('formData.spec.subscriber.ref.name', selectedValue);
        if (modelResource) {
          const { apiGroup = 'core', apiVersion, kind } = modelResource;
          const sinkApiversion = `${apiGroup}/${apiVersion}`;
          setFieldValue('formData.spec.subscriber.ref.apiVersion', sinkApiversion);
          setFieldTouched('formData.spec.subscriber.ref.apiVersion', true);
          setFieldValue('formData.spec.subscriber.ref.kind', kind);
          setFieldTouched('formData.spec.subscriber.ref.kind', true);
        }
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );

  React.useEffect(() => {
    setStatus({ subscriberAvailable: !resourceAlert });
  }, [resourceAlert, setStatus]);

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    setResourceAlert(_.isEmpty(resourceList));
  };

  // filter out resource which are owned by other resource
  const resourceFilter = ({ metadata }: K8sResourceKind) => !metadata?.ownerReferences?.length;

  return (
    <FormGroup
      fieldId={getFieldId('pubsub', 'subscriber')}
      label={t('knative-plugin~Subscriber')}
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="custom" title={t('knative-plugin~No Subscriber available')} isInline>
            <Trans t={t} ns="knative-plugin">
              {'To create a Subscriber, first create a Knative Service from the '}
              <Link
                to={`/add/ns/${namespace}`}
                onClick={() => {
                  cancel && cancel();
                }}
              >
                {'Add page'}
              </Link>
              .
            </Trans>
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="formData.spec.subscriber.ref.name"
        resources={getSinkableResources(namespace)}
        dataSelector={['metadata', 'name']}
        fullWidth
        required
        placeholder={t('knative-plugin~Select Subscriber')}
        showBadge
        autocompleteFilter={autocompleteFilter}
        onChange={onSubscriberChange}
        customResourceKey={craftResourceKey}
        disabled={resourceAlert}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
        autoSelect={autoSelect}
      />
    </FormGroup>
  );
};

export default PubSubSubscriber;
