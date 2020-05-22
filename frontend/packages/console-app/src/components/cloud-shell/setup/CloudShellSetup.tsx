import * as React from 'react';
import { Formik } from 'formik';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { ProjectRequestModel } from '@console/internal/models';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';

import { k8sCreate } from '@console/internal/module/k8s';
import {
  CloudShellSetupFormData,
  CREATE_NAMESPACE_KEY,
  cloudShellSetupValidation,
} from './cloud-shell-setup-utils';
import CloudSehellSetupForm from './CloudShellSetupForm';
import { WorkspaceModel } from '../../../models';
import { newCloudShellWorkSpace, createCloudShellResourceName } from '../cloud-shell-utils';

interface StateProps {
  activeNamespace: string;
  username: string;
}

type Props = StateProps & {
  onSubmit?: () => void;
  onCancel?: () => void;
};

const CloudShellSetup: React.FunctionComponent<Props> = ({
  activeNamespace,
  onSubmit,
  onCancel,
}) => {
  const initialValues: CloudShellSetupFormData = {
    namespace: activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace,
  };
  const handleSubmit = async (values: CloudShellSetupFormData, actions) => {
    actions.setSubmitting(true);
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
        WorkspaceModel,
        newCloudShellWorkSpace(createCloudShellResourceName(), namespace),
      );
      onSubmit && onSubmit();
    } catch (err) {
      actions.setStatus({ submitError: err.message });
    }
    actions.setSubmitting(false);
  };

  return (
    <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
      <h2>Initialize Terminal</h2>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={onCancel}
        validate={cloudShellSetupValidation}
      >
        {(props) => <CloudSehellSetupForm {...props} />}
      </Formik>
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
  activeNamespace: state.UI.get('activeNamespace'),
});

export default connect<StateProps>(mapStateToProps)(CloudShellSetup);
