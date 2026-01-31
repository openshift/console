import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { CATALOG_LABEL_KEY } from '../../const';
import { ClusterExtensionModel } from '../../models';
import ClusterExtensionForm from './ClusterExtensionForm';
import { ClusterExtensionYAMLEditor } from './ClusterExtensionYAMLEditor';

const CreateClusterExtension: FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Get operator details from URL query parameters
  const packageName = searchParams.get('packageName');
  const version = searchParams.get('version');
  const catalog = searchParams.get('catalog');

  // Generate initial data structure based on URL params
  const initialData = useMemo<K8sResourceKind>(() => {
    const data: K8sResourceKind = {
      apiVersion: `${ClusterExtensionModel.apiGroup}/${ClusterExtensionModel.apiVersion}`,
      kind: ClusterExtensionModel.kind,
      metadata: {
        name: packageName || '',
      },
      spec: {
        namespace: packageName || '',
        serviceAccount: {
          name: packageName ? `${packageName}-service-account` : '',
        },
        source: {
          sourceType: 'Catalog',
          catalog: {
            packageName: packageName || '',
            ...(catalog
              ? {
                  selector: {
                    matchLabels: {
                      [CATALOG_LABEL_KEY]: catalog,
                    },
                  },
                }
              : {}),
            ...(version ? { version } : {}),
          },
        },
      },
    };

    return data;
  }, [packageName, version, catalog]);

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY =
    'console.createClusterExtensionForm.editor.lastView';

  return (
    <>
      <DocumentTitle>{t('olm-v1~Install ClusterExtension')}</DocumentTitle>
      <PageHeading
        title={t('olm-v1~Install ClusterExtension')}
        helpText={t(
          'olm-v1~Install a ClusterExtension to add functionality to your cluster. ClusterExtensions are managed by Operator Lifecycle Manager v1.',
        )}
      />
      <SyncedEditor
        FormEditor={ClusterExtensionForm}
        initialData={initialData}
        initialType={EditorType.Form}
        YAMLEditor={ClusterExtensionYAMLEditor}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
      />
    </>
  );
};

export default CreateClusterExtension;

CreateClusterExtension.displayName = 'CreateClusterExtension';
