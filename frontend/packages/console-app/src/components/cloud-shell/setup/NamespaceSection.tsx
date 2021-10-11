import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ProjectModel } from '@console/internal/models';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/connectToFlags';
import { FLAGS, InputField, ResourceDropdownField, useFormikValidationFix } from '@console/shared';
import { CREATE_NAMESPACE_KEY } from './cloud-shell-setup-utils';

type NamespaceSectionProps = WithFlagsProps;

const NamespaceSection: React.FC<NamespaceSectionProps> = ({ flags }) => {
  const canCreate = flags[FLAGS.CAN_CREATE_PROJECT];
  const [namespace] = useField('namespace');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const { t } = useTranslation();

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
        label={t('console-app~Project')}
        placeholder={t('console-app~Select Project')}
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
                  actionTitle: t('console-app~Create Project'),
                  actionKey: CREATE_NAMESPACE_KEY,
                },
              ]
            : undefined
        }
        onLoad={handleOnLoad}
        helpText={t(
          'console-app~This Project will be used to initialize your command line terminal',
        )}
      />
      {namespace.value === CREATE_NAMESPACE_KEY && (
        <InputField
          type={TextInputTypes.text}
          required
          name="newNamespace"
          label={t('console-app~Project name')}
        />
      )}
    </>
  );
};

// exposed for testing
export const InternalNamespaceSection = NamespaceSection;

export default connectToFlags(FLAGS.CAN_CREATE_PROJECT)(NamespaceSection);
