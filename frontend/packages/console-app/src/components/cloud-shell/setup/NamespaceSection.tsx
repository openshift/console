import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues, useField } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { ProjectModel } from '@console/internal/models';
import { InputField, ResourceDropdownField, useFormikValidationFix } from '@console/shared';
import { CREATE_NAMESPACE_KEY } from './cloud-shell-setup-utils';

type NamespaceSectionProps = {};

const NamespaceSection: React.FC<NamespaceSectionProps> = () => {
  const [namespace] = useField('namespace');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();

  useFormikValidationFix(namespace.value);

  const onDropdownChange = React.useCallback(
    (key: string) => {
      setFieldTouched('namespace', true);
      setFieldValue('namespace', key);
    },
    [setFieldValue, setFieldTouched],
  );

  const handleOnLoad = (projectList: { [key: string]: string }) => {
    if (
      (_.isEmpty(projectList) || !projectList[namespace.value]) &&
      namespace.value !== CREATE_NAMESPACE_KEY
    ) {
      setFieldTouched('namespace', true);
      setFieldValue('namespace', CREATE_NAMESPACE_KEY);
    }
  };

  return (
    <>
      <ResourceDropdownField
        name="namespace"
        label="Project"
        placeholder="Select Project"
        fullWidth
        required
        selectedKey={namespace.value}
        resources={[
          {
            isList: true,
            kind: ProjectModel.kind,
            prop: ProjectModel.id,
          },
        ]}
        dataSelector={['metadata', 'name']}
        onChange={onDropdownChange}
        actionItems={[
          {
            actionTitle: 'Create Project',
            actionKey: CREATE_NAMESPACE_KEY,
          },
        ]}
        onLoad={handleOnLoad}
        helpText="This project will be used to initialize your command line terminal"
      />
      {namespace.value === CREATE_NAMESPACE_KEY && (
        <InputField type={TextInputTypes.text} required name="newNamespace" label="Project Name" />
      )}
    </>
  );
};

export default NamespaceSection;
