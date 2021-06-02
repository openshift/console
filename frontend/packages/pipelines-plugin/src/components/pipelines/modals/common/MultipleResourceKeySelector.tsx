import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ResourceDropdown, getFieldId, useFormikValidationFix } from '@console/shared';
import MultipleKeySelector from './MultipleKeySelector';

interface MultipleResourceKeySelectorProps {
  label: string;
  resourceModel: K8sKind;
  required?: boolean;
  resourceNameField: string;
  resourceKeysField: string;
  addString?: string;
}

interface StateProps {
  namespace: string;
}

const MultipleResourceKeySelector: React.FC<StateProps & MultipleResourceKeySelectorProps> = ({
  label,
  namespace,
  resourceModel,
  required,
  resourceNameField,
  resourceKeysField,
  addString,
}) => {
  const { t } = useTranslation();
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [field, { touched, error }] = useField(resourceNameField);
  const isValid = !(touched && error);
  const fieldId = getFieldId(resourceNameField, 'res-dropdown');
  const [keys, setKeys] = React.useState({});

  useFormikValidationFix(field.value);

  const resource: WatchK8sResource = React.useMemo(
    () => ({
      kind: resourceModel.kind,
      isList: true,
      namespace,
      optional: true,
    }),
    [namespace, resourceModel.kind],
  );

  const [resources, loaded, loadError] = useK8sWatchResource(resource);

  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const generateKeys = (resourceName: string) => {
    const selectedResource: K8sResourceKind = _.find(resources, (res) => {
      return _.get(res, 'metadata.name') === resourceName;
    });
    const keyMap = selectedResource?.data ?? {};
    const itemKeys = Object.keys(keyMap).reduce((acc, key) => ({ ...acc, [key]: key }), {});
    setKeys(itemKeys);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      validated={isValid ? 'default' : 'error'}
      className="odc-multiple-key-selector"
      isRequired={required}
    >
      <ResourceDropdown
        resources={[
          { kind: resourceModel.kind, loaded, loadError, data: resources as K8sResourceKind[] },
        ]}
        loaded={loaded}
        loadError={loadError}
        dataSelector={['metadata', 'name']}
        selectedKey={field.value}
        placeholder={t('pipelines-plugin~Select a {{label}}', { label: t(resourceModel.labelKey) })}
        autocompleteFilter={autocompleteFilter}
        dropDownClassName={cx({ 'dropdown--full-width': true })}
        onChange={(value: string) => {
          setFieldValue(resourceKeysField, undefined);
          setFieldValue(resourceNameField, value);
          setFieldTouched(resourceNameField, true);
          generateKeys(value);
        }}
        showBadge
      />
      {field.value && !_.isEmpty(keys) && (
        <MultipleKeySelector name={resourceKeysField} keys={keys} addString={addString} />
      )}
    </FormGroup>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

export default connect<StateProps, null, MultipleResourceKeySelectorProps>(mapStateToProps)(
  MultipleResourceKeySelector,
);
