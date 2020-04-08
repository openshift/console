import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, MultiColumnField } from '@console/shared';
import { AsyncComponent } from '@console/internal/components/utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getSuggestedName } from '@console/dev-console/src/utils/imagestream-utils';

const containerPaths = {
  Image: 'data.containersource.containers[0].image',
  Name: 'data.containersource.containers[0].name',
  Env: 'data.containersource.containers[0].env',
  Args: 'data.containersource.containers[0].args',
};

const ContainerSourceSection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    data: {
      containersource: {
        containers: [{ env: envs, args }],
      },
    },
  } = values;
  const initialEnvValues = !_.isEmpty(envs) ? _.map(envs, (env) => _.values(env)) : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialEnvValues);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => (value.length ? { name, value } : null)),
      );
      setNameValue(nameValuePairs);
      setFieldValue(containerPaths.Env, updatedNameValuePairs);
    },
    [setFieldValue],
  );
  return (
    <FormSection title="ContainerSource" extraMargin>
      <h3 className="co-section-heading-tertiary">Container</h3>
      <InputField
        data-test-id="container-image-field"
        type={TextInputTypes.text}
        name={containerPaths.Image}
        label="Image"
        required
        onChange={(e) => {
          setFieldValue(containerPaths.Name, getSuggestedName(e.target.value));
        }}
      />
      <InputField
        data-test-id="container-name-field"
        type={TextInputTypes.text}
        name={containerPaths.Name}
        label="Name"
      />
      <MultiColumnField
        data-test-id="container-arg-field"
        name={containerPaths.Args}
        addLabel="Add args"
        label="Arguments"
        headers={[]}
        emptyValues={{ name: '' }}
        disableDeleteRow={args?.length === 1}
        emptyMessage="No args are associated with the container."
      >
        <InputField name="name" type={TextInputTypes.text} placeholder="args" />
      </MultiColumnField>
      <FormGroup fieldId="containersource-env" label="Environment variables">
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          data-test-id="container-env-field"
          nameValuePairs={nameValue}
          valueString="Value"
          nameString="Name"
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
    </FormSection>
  );
};

export default ContainerSourceSection;
