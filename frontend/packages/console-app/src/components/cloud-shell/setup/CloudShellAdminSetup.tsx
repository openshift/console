import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { LoadError } from '@console/internal/components/utils/status-box';
import { NamespaceModel } from '@console/internal/models';
import { K8sKind, k8sCreate, k8sGet } from '@console/internal/module/k8s';
import {
  newCloudShellWorkSpace,
  createCloudShellResourceName,
  CLOUD_SHELL_PROTECTED_NAMESPACE,
} from '../cloud-shell-utils';
import TerminalLoadingBox from '../TerminalLoadingBox';

type Props = {
  onInitialize: (namespace: string) => void;
  workspaceModel: K8sKind;
  operatorNamespace: string;
};

const CloudShellAdminSetup: React.FunctionComponent<Props> = ({
  onInitialize,
  workspaceModel,
  operatorNamespace,
}) => {
  const { t } = useTranslation();

  const [initError, setInitError] = React.useState<string>();
  React.useEffect(() => {
    (async () => {
      async function namespaceExists(): Promise<boolean> {
        try {
          await k8sGet(NamespaceModel, CLOUD_SHELL_PROTECTED_NAMESPACE);
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
        if (!protectedNamespaceExists) {
          await k8sCreate(NamespaceModel, {
            metadata: {
              name: CLOUD_SHELL_PROTECTED_NAMESPACE,
            },
          });
        }
        await k8sCreate(
          workspaceModel,
          newCloudShellWorkSpace(
            createCloudShellResourceName(),
            CLOUD_SHELL_PROTECTED_NAMESPACE,
            operatorNamespace,
            workspaceModel.apiVersion,
          ),
        );
        onInitialize(CLOUD_SHELL_PROTECTED_NAMESPACE);
      } catch (error) {
        setInitError(error);
      }
    })();
    // Don't include dependencies because if the CLOUD_SHELL_PROTECTED_NAMESPACE
    // is not found a refresh will be triggered, creating an extra terminal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initError) {
    return (
      <LoadError message={initError} label={t('console-app~OpenShift command line terminal')} />
    );
  }

  return (
    <div className="co-cloudshell-terminal__container">
      <TerminalLoadingBox />
    </div>
  );
};

export default connect()(CloudShellAdminSetup);
