import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Title } from '@patternfly/react-core';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { k8sGetResource, k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
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
import CloudShellSetupForm from './CloudShellSetupForm';
import './CloudShellSetup.scss';

type Props = {
  onSubmit?: (namespace: string) => void;
  onCancel?: () => void;
  workspaceModel: K8sModel;
  operatorNamespace: string;
};

const CloudShellAdminSetup: FunctionComponent<Props> = ({
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

  const [initError, setInitError] = useState<string>();

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
      <LoadError label={t('webterminal-plugin~OpenShift command line terminal')}>
        {initError}
      </LoadError>
    );
  }

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
        {(formikProps) => <CloudShellSetupForm {...formikProps} isAdmin />}
      </Formik>
    </div>
  );
};

export default connect()(CloudShellAdminSetup);
