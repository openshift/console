import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { connect } from 'react-redux';
import { history, PageHeading, useAccessReview } from '@console/internal/components/utils';
import { formatNamespacedRouteForResource } from '@console/internal/actions/ui';
import {
  BuildConfigModel,
  ImageStreamModel,
  DeploymentConfigModel,
  ImageStreamImportsModel,
  SecretModel,
  RouteModel,
  ServiceModel,
} from '@console/internal/models';
import { AccessReviewResourceAttributes, K8sKind } from '@console/internal/module/k8s';
import * as importGitIcon from '../images/from-git.svg';
import * as yamlIcon from '../images/yaml.svg';
import * as dockerfileIcon from '../images/dockerfile.svg';
import './EmptyState.scss';

interface StateProps {
  activeNamespace: string;
}

export interface EmptySProps {
  title: string;
  hintBlock?: React.ReactNode;
}

type Props = EmptySProps & StateProps;

const navigateTo = (e: React.SyntheticEvent, url: string) => {
  history.push(url);
  e.preventDefault();
};

const resourceAttributes = (model: K8sKind, namespace: string): AccessReviewResourceAttributes => {
  return {
    group: model.apiGroup || '',
    resource: model.plural,
    namespace,
    verb: 'create',
  };
};

const ODCEmptyState: React.FC<Props> = ({
  title,
  activeNamespace,
  hintBlock = 'Select a way to create an application, component or service from one of the options.',
}) => {
  const buildConfigsAccess = useAccessReview(resourceAttributes(BuildConfigModel, activeNamespace));
  const imageStreamAccess = useAccessReview(resourceAttributes(ImageStreamModel, activeNamespace));
  const deploymentConfigAccess = useAccessReview(
    resourceAttributes(DeploymentConfigModel, activeNamespace),
  );
  const imageStreamImportAccess = useAccessReview(
    resourceAttributes(ImageStreamImportsModel, activeNamespace),
  );
  const secretAccess = useAccessReview(resourceAttributes(SecretModel, activeNamespace));
  const routeAccess = useAccessReview(resourceAttributes(RouteModel, activeNamespace));
  const serviceAccess = useAccessReview(resourceAttributes(ServiceModel, activeNamespace));

  const allImportResourceAccess =
    buildConfigsAccess &&
    imageStreamAccess &&
    deploymentConfigAccess &&
    secretAccess &&
    routeAccess &&
    serviceAccess;

  const allCatalogImageResourceAccess = allImportResourceAccess && imageStreamImportAccess;

  return (
    <>
      <div className="odc-empty-state__title">
        <PageHeading title={title} />
        {hintBlock && (
          <div className="co-catalog-page__description odc-empty-state__hint-block">
            {hintBlock}
          </div>
        )}
      </div>
      <div className="odc-empty-state__content">
        {allImportResourceAccess && (
          <CatalogTile
            onClick={(e: React.SyntheticEvent) => navigateTo(e, '/import?importType=git')}
            href="/import?importType=git"
            title="From Git"
            iconImg={importGitIcon}
            description="Import code from your git repository to be built and deployed"
            data-test-id="import-from-git"
          />
        )}
        {allCatalogImageResourceAccess && (
          <CatalogTile
            onClick={(e: React.SyntheticEvent) =>
              navigateTo(e, `/deploy-image?preselected-ns=${activeNamespace}`)
            }
            href={`/deploy-image?preselected-ns=${activeNamespace}`}
            title="Container Image"
            iconClass="pficon-image"
            description="Deploy an existing image from an image registry or image stream tag"
          />
        )}
        <CatalogTile
          onClick={(e: React.SyntheticEvent) => navigateTo(e, '/catalog')}
          href="/catalog"
          title="From Catalog"
          iconClass="pficon-catalog"
          description="Browse the catalog to discover, deploy and connect to services"
        />
        {allImportResourceAccess && (
          <CatalogTile
            onClick={(e: React.SyntheticEvent) => navigateTo(e, '/import?importType=docker')}
            href="/import?importType=docker"
            title="From Dockerfile"
            iconImg={dockerfileIcon}
            description="Import your Dockerfile from your git repo to be built & deployed"
          />
        )}
        <CatalogTile
          onClick={(e: React.SyntheticEvent) =>
            navigateTo(e, formatNamespacedRouteForResource('import', activeNamespace))
          }
          href={formatNamespacedRouteForResource('import', activeNamespace)}
          title="YAML"
          iconImg={yamlIcon}
          description="Create resources from their YAML or JSON definitions"
        />
        <CatalogTile
          onClick={(e: React.SyntheticEvent) => navigateTo(e, '/catalog?category=databases')}
          href="/catalog?category=databases"
          title="Database"
          iconClass="fas fa-database"
          description="Browse the catalog to discover database services to add to your application"
        />
      </div>
    </>
  );
};

const mapStateToProps = (state): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export default connect<StateProps>(mapStateToProps)(ODCEmptyState);
