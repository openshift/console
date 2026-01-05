import type { FunctionComponent } from 'react';
import { Title } from '@patternfly/react-core';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { ProjectRequestModel } from '@console/internal/models';
import { k8sCreate, K8sKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { newCloudShellWorkSpace, createCloudShellResourceName } from '../cloud-shell-utils';
import {
  CloudShellSetupFormData,
  CREATE_NAMESPACE_KEY,
  cloudShellSetupValidationSchema,
  getCloudShellTimeout,
} from './cloud-shell-setup-utils';
import CloudShellSetupForm from './CloudShellSetupForm';
import './CloudShellSetup.scss';

interface StateProps {
  activeNamespace: string;
  username: string;
}

type Props = StateProps & {
  onSubmit?: (namespace: string) => void;
  onCancel?: () => void;
  workspaceModel: K8sKind;
  operatorNamespace: string;
};

const CloudShellDeveloperSetup: FunctionComponent<Props> = ({
  activeNamespace,
  workspaceModel,
  operatorNamespace,
  onSubmit,
  onCancel,
}) => {
  const initialValues: CloudShellSetupFormData = {
    namespace: activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace,
    advancedOptions: {
      timeout: {
        limit: null,
        unit: 'm',
      },
    },
  };
  const { t } = useTranslation();

  const handleSubmit = async (values: CloudShellSetupFormData, actions) => {
    const createNamespace = values.namespace === CREATE_NAMESPACE_KEY;
    const namespace = createNamespace ? values.newNamespace : values.namespace;
    const csTimeout = getCloudShellTimeout(
      values.advancedOptions?.timeout?.limit,
      values.advancedOptions?.timeout?.unit,
    );
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
          operatorNamespace,
          workspaceModel.apiVersion,
          csTimeout,
          values.advancedOptions?.image,
        ),
      );
      onSubmit && onSubmit(namespace);
    } catch (err) {
      actions.setStatus({ submitError: err.message });
    }
  };

  return (
    <div className="wt-cloud-shell-setup">
      <Title headingLevel="h2" className="wt-cloud-shell-setup--title">
        {t('webterminal-plugin~Initialize terminal')}
      </Title>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={onCancel}
        validationSchema={cloudShellSetupValidationSchema()}
      >
        {(formikProps) => <CloudShellSetupForm {...formikProps} />}
      </Formik>
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  username: getUser(state)?.username || '',
  activeNamespace: state.UI.get('activeNamespace'),
});

export default connect<StateProps>(mapStateToProps)(CloudShellDeveloperSetup);
