import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { SectionHeading } from '@console/internal/components/utils';
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
import CloudSehellSetupForm from './CloudShellSetupForm';

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

const CloudShellDeveloperSetup: React.FunctionComponent<Props> = ({
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
    <>
      <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
        <SectionHeading
          text={t('webterminal-plugin~Initialize terminal')}
          style={{ marginBottom: 0 }}
        />
      </div>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={onCancel}
        validationSchema={cloudShellSetupValidationSchema()}
      >
        {(formikProps) => <CloudSehellSetupForm {...formikProps} />}
      </Formik>
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  username: getUser(state)?.username || '',
  activeNamespace: state.UI.get('activeNamespace'),
});

export default connect<StateProps>(mapStateToProps)(CloudShellDeveloperSetup);
