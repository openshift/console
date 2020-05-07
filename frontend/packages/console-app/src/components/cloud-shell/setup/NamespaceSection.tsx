import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues, useField } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { ProjectModel } from '@console/internal/models';
import { InputField, ResourceDropdownField, useFormikValidationFix, FLAGS } from '@console/shared';
import { connectToFlags, WithFlagsProps } from '@console/shared/src/hocs/connect-flags';
import { CREATE_NAMESPACE_KEY } from './cloud-shell-setup-utils';

type NamespaceSectionProps = WithFlagsProps;

const NamespaceSection: React.FC<NamespaceSectionProps> = ({ flags }) => {
  const canCreate = flags[FLAGS.CAN_CREATE_PROJECT];
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
    const noProjects = _.isEmpty(projectList);
    if (noProjects || !projectList[namespace.value]) {
      if (canCreate && namespace.value !== CREATE_NAMESPACE_KEY) {
        setFieldValue('namespace', CREATE_NAMESPACE_KEY);
      }
      if (!canCreate && namespace.value) {
        setFieldValue('namespace', undefined);
      }
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
        actionItems={
          canCreate
            ? [
                {
                  actionTitle: 'Create Project',
                  actionKey: CREATE_NAMESPACE_KEY,
                },
              ]
            : undefined
        }
        onLoad={handleOnLoad}
        helpText="This project will be used to initialize your command line terminal"
      />
      {namespace.value === CREATE_NAMESPACE_KEY && (
        <InputField type={TextInputTypes.text} required name="newNamespace" label="Project Name" />
      )}
    </>
  );
};

// exposed for testing
export const InternalNamespaceSection = NamespaceSection;

export default connectToFlags(FLAGS.CAN_CREATE_PROJECT)(NamespaceSection);
