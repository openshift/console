import type { FC } from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { ClusterExtensionModel } from '../../models';

const CreateClusterExtension: FC = (props) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Get operator details from URL query parameters
  const packageName = searchParams.get('packageName');
  const version = searchParams.get('version');
  const catalog = searchParams.get('catalog');

  // Generate the YAML template based on the operator details
  const template = useMemo(() => {
    return `apiVersion: ${ClusterExtensionModel.apiGroup}/${ClusterExtensionModel.apiVersion}
kind: ${ClusterExtensionModel.kind}
metadata:
  name: ${packageName || 'example'}
spec:
  namespace: ${packageName || '<operator-namespace>'}
  serviceAccount:
    name: ${packageName ? `${packageName}-service-account` : '<service-account-name>'}
  source:
    sourceType: Catalog
    catalog:
      packageName: ${packageName || '<package-name>'}\n
      version : ${version || '<version>'}
      selector:
        matchLabels:
          olm.operatorframework.io/metadata.name: ${catalog || '<cluster-catalog-name>'}
`;
  }, [packageName, version, catalog]);

  return <CreateYAML {...(props as any)} template={template} />;
};

export default CreateClusterExtension;

CreateClusterExtension.displayName = 'CreateClusterExtension';
