import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ProjectModel } from '@console/internal/models';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/connectToFlags';
import { InputField, ResourceDropdownField, useFormikValidationFix, FLAGS } from '@console/shared';
import { CREATE_NAMESPACE_KEY } from './cloud-shell-setup-utils';
import './NamespaceSection.scss';

type NamespaceSectionProps = WithFlagsProps;

const NamespaceSection: React.FC<NamespaceSectionProps> = ({ flags }) => {
  const canCreateNs = flags[FLAGS.CAN_CREATE_NS];
  const canCreateProject = flags[FLAGS.CAN_CREATE_PROJECT];
  const canCreate = canCreateNs || canCreateProject;
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
        label={t('webterminal-plugin~Project')}
        placeholder={t('webterminal-plugin~Select Project')}
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
                  actionTitle: t('webterminal-plugin~Create Project'),
                  actionKey: CREATE_NAMESPACE_KEY,
                },
              ]
            : undefined
        }
        onLoad={handleOnLoad}
        helpText={t(
          'webterminal-plugin~This Project will be used to initialize your command line terminal',
        )}
      />
      {namespace.value === CREATE_NAMESPACE_KEY && (
        <div className="wt-project-name">
          <InputField
            type={TextInputTypes.text}
            required
            name="newNamespace"
            label={t('webterminal-plugin~Project name')}
          />
        </div>
      )}
    </>
  );
};

// exposed for testing
export const InternalNamespaceSection = NamespaceSection;

export default connectToFlags(FLAGS.CAN_CREATE_PROJECT)(NamespaceSection);
