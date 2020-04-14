import * as React from 'react';
import { connect } from 'react-redux';
import { useField, useFormikContext, FormikValues } from 'formik';
import cx from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceDropdown, getFieldId } from '@console/shared';
import { FormGroup } from '@patternfly/react-core';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import MultipleKeySelector from './MultipleKeySelector';

interface MultipleResourceKeySelectorProps {
  name: string;
  label: string;
  resourceModel: K8sKind;
  fullWidth?: boolean;
}

interface StateProps {
  namespace: string;
}

const MultipleResourceKeySelector: React.FC<StateProps & MultipleResourceKeySelectorProps> = ({
  fullWidth,
  name,
  label,
  namespace,
  resourceModel,
}) => {
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [field, { touched, error }] = useField(`${name}.name`);
  const isValid = !(touched && error);
  const fieldId = getFieldId(`${name}.name`, 'res-dropdown');
  const [keys, setKeys] = React.useState({});

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
    const keyMap = selectedResource?.data;
    const itemKeys = {};
    _.mapKeys(keyMap, (value, key) => (itemKeys[key] = key));
    setKeys(itemKeys);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      isValid={isValid}
      className="odc-multiple-key-selector"
    >
      <ResourceDropdown
        resources={[
          { kind: resourceModel.kind, loaded, loadError, data: resources as K8sResourceKind[] },
        ]}
        loaded={loaded}
        loadError={loadError}
        dataSelector={['metadata', 'name']}
        selectedKey={field.value}
        placeholder={`Select a ${resourceModel.label}`}
        autocompleteFilter={autocompleteFilter}
        dropDownClassName={cx({ 'dropdown--full-width': fullWidth })}
        onChange={(value: string) => {
          setFieldValue(`${name}.name`, value);
          setFieldTouched(`${name}.name`, true);
          generateKeys(value);
        }}
        showBadge
      />
      <MultipleKeySelector name={`${name}.items`} keys={keys} fullWidth={fullWidth} />
    </FormGroup>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

export default connect<StateProps, null, MultipleResourceKeySelectorProps>(mapStateToProps)(
  MultipleResourceKeySelector,
);
