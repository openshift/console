import * as React from 'react';
import { Card, CardBody, CardHeader, CardFooter, Grid, GridItem } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatNamespacedRouteForResource } from '@console/internal/actions/ui';
import { PageHeading } from '@console/internal/components/utils';
import './EmptyState.scss';

interface StateProps {
  activeNamespace: string;
}

export interface EmptySProps {
  title: string;
}

type Props = EmptySProps & StateProps;

const ODCEmptyState: React.FunctionComponent<Props> = ({ title, activeNamespace }) => (
  <React.Fragment>
    <div className="odc-empty-state__title">
      <PageHeading title={title} />
    </div>
    <div className="odc-empty-state__content">
      <Grid gutter="md">
        <GridItem sm={6} md={6} lg={4}>
          <Card className="odc-empty-state__card">
            <CardHeader>Import from Git</CardHeader>
            <CardBody>Import code from your git repository to be built and deployed </CardBody>
            <CardFooter>
              <Link className="pf-c-button pf-m-secondary" to="/import">
                Import from Git
              </Link>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem sm={6} md={6} lg={4}>
          <Card className="odc-empty-state__card">
            <CardHeader>Browse Catalog</CardHeader>
            <CardBody>Browse the catalog to discover, deploy and connect to services</CardBody>
            <CardFooter>
              <Link className="pf-c-button pf-m-secondary" to="/catalog">
                Browse Catalog
              </Link>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem sm={6} md={6} lg={4}>
          <Card className="odc-empty-state__card">
            <CardHeader>Deploy Image</CardHeader>
            <CardBody>Deploy an existing image from an image registry or image stream tag</CardBody>
            <CardFooter>
              <Link
                className="pf-c-button pf-m-secondary"
                to={`/deploy-image?preselected-ns=${activeNamespace}`}
              >
                Deploy Image
              </Link>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem sm={6} md={6} lg={4}>
          <Card className="odc-empty-state__card">
            <CardHeader>Import YAML</CardHeader>
            <CardBody>Create or replace resources from their YAML or JSON definitions.</CardBody>
            <CardFooter>
              <Link
                className="pf-c-button pf-m-secondary"
                to={formatNamespacedRouteForResource('import', activeNamespace)}
              >
                Import YAML
              </Link>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem sm={6} md={6} lg={4}>
          <Card className="odc-empty-state__card">
            <CardHeader>Add Database</CardHeader>
            <CardBody>
              Browse the catalog to discover database services to add to your application
            </CardBody>
            <CardFooter>
              <Link className="pf-c-button pf-m-secondary" to="/catalog?category=databases">
                Add Database
              </Link>
            </CardFooter>
          </Card>
        </GridItem>
      </Grid>
    </div>
  </React.Fragment>
);

const mapStateToProps = (state): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export default connect<StateProps>(mapStateToProps)(ODCEmptyState);
