import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ProjectRequestModel } from '@console/internal/models';
import { k8sCreate, K8sKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { newCloudShellWorkSpace, createCloudShellResourceName } from '../cloud-shell-utils';
import {
  CloudShellSetupFormData,
  CREATE_NAMESPACE_KEY,
  cloudShellSetupValidation,
} from './cloud-shell-setup-utils';
import CloudSehellSetupForm from './CloudShellSetupForm';

interface StateProps {
  activeNamespace: string;
  username: string;
}

type Props = StateProps & {
  onSubmit?: (namespace: string) => void;
  onCancel?: () => void;
  workspaceModel: K8sKind;
};

const CloudShellDeveloperSetup: React.FunctionComponent<Props> = ({
  activeNamespace,
  workspaceModel,
  onSubmit,
  onCancel,
}) => {
  const initialValues: CloudShellSetupFormData = {
    namespace: activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace,
  };
  const { t } = useTranslation();

  const handleSubmit = async (values: CloudShellSetupFormData, actions) => {
    const createNamespace = values.namespace === CREATE_NAMESPACE_KEY;
    const namespace = createNamespace ? values.newNamespace : values.namespace;

    try {
      if (createNamespace) {
        await k8sCreate(ProjectRequestModel, {
          metadata: {
            name: namespace,
          },
        });
      }
      await k8sCreate(
        workspaceModel,
        newCloudShellWorkSpace(
          createCloudShellResourceName(),
          namespace,
          workspaceModel.apiVersion,
        ),
      );
      onSubmit && onSubmit(namespace);
    } catch (err) {
      actions.setStatus({ submitError: err.message });
    }
  };

  return (
    <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
      <h2>{t('cloudshell~Initialize terminal')}</h2>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={onCancel}
        validate={cloudShellSetupValidation}
      >
        {(formikProps) => <CloudSehellSetupForm {...formikProps} />}
      </Formik>
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
  activeNamespace: state.UI.get('activeNamespace'),
});

export default connect<StateProps>(mapStateToProps)(CloudShellDeveloperSetup);
