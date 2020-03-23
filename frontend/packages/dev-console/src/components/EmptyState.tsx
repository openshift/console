import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { connect } from 'react-redux';
import { history, PageHeading } from '@console/internal/components/utils';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import { FLAG_KNATIVE_EVENTING } from '@console/knative-plugin';
import * as importGitIcon from '../images/from-git.svg';
import * as yamlIcon from '../images/yaml.svg';
import * as dockerfileIcon from '../images/dockerfile.svg';
import { useAddToProjectAccess } from '../utils/useAddToProjectAccess';
import { allCatalogImageResourceAccess, allImportResourceAccess } from '../actions/add-resources';
import './EmptyState.scss';

interface StateProps {
  activeNamespace: string;
  isEventSourceEnabled?: boolean;
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

const ODCEmptyState: React.FC<Props> = ({
  title,
  activeNamespace,
  hintBlock = 'Select a way to create an application, component or service from one of the options.',
  isEventSourceEnabled = false,
}) => {
  const createResourceAccess: string[] = useAddToProjectAccess(activeNamespace);

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
        <Gallery className="co-catalog-tile-view" gutter="sm">
          {createResourceAccess.includes(allImportResourceAccess) && (
            <GalleryItem key="gallery-fromgit">
              <CatalogTile
                className="odc-empty-state__tile"
                onClick={(e: React.SyntheticEvent) => navigateTo(e, '/import?importType=git')}
                href="/import?importType=git"
                title="From Git"
                iconImg={importGitIcon}
                description="Import code from your git repository to be built and deployed"
                data-test-id="import-from-git"
              />
            </GalleryItem>
          )}
          {createResourceAccess.includes(allCatalogImageResourceAccess) && (
            <GalleryItem key="gallery-container">
              <CatalogTile
                className="odc-empty-state__tile"
                onClick={(e: React.SyntheticEvent) =>
                  navigateTo(e, `/deploy-image?preselected-ns=${activeNamespace}`)
                }
                href={`/deploy-image?preselected-ns=${activeNamespace}`}
                title="Container Image"
                iconClass="pficon-image"
                description="Deploy an existing image from an image registry or image stream tag"
              />
            </GalleryItem>
          )}
          <GalleryItem key="gallery-catalog">
            <CatalogTile
              className="odc-empty-state__tile"
              onClick={(e: React.SyntheticEvent) => navigateTo(e, '/catalog')}
              href="/catalog"
              title="From Catalog"
              iconClass="pficon-catalog"
              description="Browse the catalog to discover, deploy and connect to services"
            />
          </GalleryItem>
          {createResourceAccess.includes(allImportResourceAccess) && (
            <GalleryItem key="gallery-dockerfile">
              <CatalogTile
                className="odc-empty-state__tile"
                onClick={(e: React.SyntheticEvent) => navigateTo(e, '/import?importType=docker')}
                href="/import?importType=docker"
                title="From Dockerfile"
                iconImg={dockerfileIcon}
                description="Import your Dockerfile from your git repo to be built & deployed"
              />
            </GalleryItem>
          )}
          <GalleryItem key="gallery-yaml">
            <CatalogTile
              className="odc-empty-state__tile"
              onClick={(e: React.SyntheticEvent) =>
                navigateTo(e, formatNamespacedRouteForResource('import', activeNamespace))
              }
              href={formatNamespacedRouteForResource('import', activeNamespace)}
              title="YAML"
              iconImg={yamlIcon}
              description="Create resources from their YAML or JSON definitions"
            />
          </GalleryItem>
          <GalleryItem key="gallery-database">
            <CatalogTile
              className="odc-empty-state__tile"
              onClick={(e: React.SyntheticEvent) => navigateTo(e, '/catalog?category=databases')}
              href="/catalog?category=databases"
              title="Database"
              iconClass="fas fa-database"
              description="Browse the catalog to discover database services to add to your application"
            />
          </GalleryItem>
          {isEventSourceEnabled && (
            <GalleryItem key="gallery-eventsource">
              <CatalogTile
                className="odc-empty-state__tile"
                onClick={(e: React.SyntheticEvent) => navigateTo(e, `/event-source`)}
                href={`/event-source`}
                title="Event Source"
                iconClass="pficon-help"
                description="Create an event source and sink it to Knative service"
              />
            </GalleryItem>
          )}
        </Gallery>
      </div>
    </>
  );
};

const mapStateToProps = (state): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
    isEventSourceEnabled: state.FLAGS.get(FLAG_KNATIVE_EVENTING),
  };
};

export default connect<StateProps>(mapStateToProps)(ODCEmptyState);
