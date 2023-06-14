import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { k8sGetResource, k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { SectionHeading } from '@console/internal/components/utils';
import { LoadError } from '@console/internal/components/utils/status-box';
import { NamespaceModel } from '@console/internal/models';
import {
  newCloudShellWorkSpace,
  createCloudShellResourceName,
  CLOUD_SHELL_PROTECTED_NAMESPACE,
} from '../cloud-shell-utils';
import {
  CloudShellSetupFormData,
  cloudShellSetupValidationSchema,
  getCloudShellTimeout,
} from './cloud-shell-setup-utils';
import CloudSehellSetupForm from './CloudShellSetupForm';

type Props = {
  onSubmit?: (namespace: string) => void;
  onCancel?: () => void;
  workspaceModel: K8sModel;
  operatorNamespace: string;
};

const CloudShellAdminSetup: React.FunctionComponent<Props> = ({
  onSubmit,
  onCancel,
  workspaceModel,
  operatorNamespace,
}) => {
  const initialValues: CloudShellSetupFormData = {
    namespace: CLOUD_SHELL_PROTECTED_NAMESPACE,
    advancedOptions: {
      timeout: {
        limit: null,
        unit: 'm',
      },
    },
  };

  const { t } = useTranslation();

  const [initError, setInitError] = React.useState<string>();

  const handleSubmit = async (values: CloudShellSetupFormData, actions) => {
    async function namespaceExists(): Promise<boolean> {
      try {
        await k8sGetResource({
          model: NamespaceModel,
          name: CLOUD_SHELL_PROTECTED_NAMESPACE,
        });
        return true;
      } catch (error) {
        if (error.json.code !== 404) {
          setInitError(error);
        }
        return false;
      }
    }
    try {
      const protectedNamespaceExists = await namespaceExists();
      const csTimeout = getCloudShellTimeout(
        values.advancedOptions?.timeout?.limit,
        values.advancedOptions?.timeout?.unit,
      );

      if (!protectedNamespaceExists) {
        await k8sCreateResource({
          model: NamespaceModel,
          data: {
            metadata: {
              name: CLOUD_SHELL_PROTECTED_NAMESPACE,
            },
          },
        });
      }
      await k8sCreateResource({
        model: workspaceModel,
        data: newCloudShellWorkSpace(
          createCloudShellResourceName(),
          values.namespace,
          operatorNamespace,
          workspaceModel.apiVersion,
          csTimeout,
          values.advancedOptions?.image,
        ),
      });
      onSubmit(values.namespace);
    } catch (error) {
      actions.setStatus({ submitError: error.message });
      setInitError(error);
    }
  };

  if (initError) {
    return (
      <LoadError
        message={initError}
        label={t('webterminal-plugin~OpenShift command line terminal')}
      />
    );
  }

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
        {(formikProps) => <CloudSehellSetupForm {...formikProps} isAdmin />}
      </Formik>
    </>
  );
};

export default connect()(CloudShellAdminSetup);
