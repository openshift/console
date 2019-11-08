import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Modal } from 'patternfly-react';
import {
  CatalogItemHeader,
  PropertiesSidePanel,
  PropertyItem,
} from '@patternfly/react-catalog-view-extension';

import { normalizeIconClass } from './catalog-item-icon';
import { ClusterServicePlanModel } from '../../models';
import { k8sGet } from '../../module/k8s';
import { Timestamp, ExternalLink } from '../utils';

export class CatalogTileDetails extends React.Component {
  state = {
    plans: [],
  };

  componentDidMount() {
    const { obj, kind } = this.props.item;
    if (kind === 'ClusterServiceClass') {
      this.getPlans(obj);
    }
  }

  getPlans(obj) {
    k8sGet(ClusterServicePlanModel, null, null, {
      queryParams: { fieldSelector: `spec.clusterServiceClassRef.name=${obj.metadata.name}` },
    }).then(({ items: plans }) => {
      this.setState({
        plans: _.orderBy(plans, ['spec.externalMetadata.displayName', 'metadata.name']),
      });
    });
  }

  render() {
    const { closeOverlay } = this.props;
    const {
      obj,
      kind,
      tileName,
      tileImgUrl,
      tileIconClass,
      tileProvider,
      tileDescription,
      href,
      supportUrl,
      longDescription,
      documentationUrl,
      sampleRepo,
    } = this.props.item;
    const { plans } = this.state;

    const vendor = tileProvider ? `Provided by ${tileProvider}` : null;
    const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
    const creationTimestamp = _.get(obj, 'metadata.creationTimestamp');

    const supportUrlLink = <ExternalLink href={supportUrl} text="Get support" />;
    const documentationUrlLink = (
      <ExternalLink
        href={documentationUrl}
        additionalClassName="co-break-all"
        text={documentationUrl}
      />
    );
    const sampleRepoLink = (
      <ExternalLink href={sampleRepo} additionalClassName="co-break-all" text={sampleRepo} />
    );
    const planItems = _.map(plans, (plan) => (
      <li key={plan.metadata.uid}>{plan.spec.description || plan.spec.externalName}</li>
    ));

    return (
      <>
        <Modal.Header>
          <Modal.CloseButton onClick={closeOverlay} />
          <CatalogItemHeader
            title={tileName}
            vendor={vendor}
            iconClass={iconClass}
            iconImg={tileImgUrl}
          />
        </Modal.Header>
        <Modal.Body>
          <div className="modal-body-content">
            <div className="modal-body-inner-shadow-covers">
              <div className="co-catalog-page__overlay-body">
                <PropertiesSidePanel>
                  <Link
                    className="pf-c-button pf-m-primary co-catalog-page__overlay-create"
                    to={href}
                    role="button"
                    title={this.props.item.createLabel}
                    onClick={closeOverlay}
                  >
                    {this.props.item.createLabel}
                  </Link>
                  {tileProvider && <PropertyItem label="Provider" value={tileProvider} />}
                  {supportUrl && <PropertyItem label="Support" value={supportUrlLink} />}
                  {creationTimestamp && (
                    <PropertyItem
                      label="Created At"
                      value={<Timestamp timestamp={creationTimestamp} />}
                    />
                  )}
                </PropertiesSidePanel>
                <div className="co-catalog-page__overlay-description">
                  {tileDescription && <p>{tileDescription}</p>}
                  {longDescription && <p>{longDescription}</p>}
                  {sampleRepo && <p>Sample repository: {sampleRepoLink}</p>}
                  {documentationUrl && (
                    <>
                      <h2 className="h5">Documentation</h2>
                      <p>{documentationUrlLink}</p>
                    </>
                  )}
                  {!_.isEmpty(plans) && (
                    <>
                      <h2 className="h5">Service Plans</h2>
                      <ul>{planItems}</ul>
                    </>
                  )}
                  {kind === 'ImageStream' && (
                    <>
                      <hr />
                      <p>The following resources will be created:</p>
                      <ul>
                        <li>
                          A{' '}
                          <span className="co-catalog-item-details__kind-label">build config</span>{' '}
                          to build source from a Git repository.
                        </li>
                        <li>
                          An{' '}
                          <span className="co-catalog-item-details__kind-label">image stream</span>{' '}
                          to track built images.
                        </li>
                        <li>
                          A{' '}
                          <span className="co-catalog-item-details__kind-label">
                            deployment config
                          </span>{' '}
                          to rollout new revisions when the image changes.
                        </li>
                        <li>
                          A <span className="co-catalog-item-details__kind-label">service</span> to
                          expose your workload inside the cluster.
                        </li>
                        <li>
                          An optional{' '}
                          <span className="co-catalog-item-details__kind-label">route</span> to
                          expose your workload outside the cluster.
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </>
    );
  }
}

CatalogTileDetails.displayName = 'CatalogTileDetails';
CatalogTileDetails.propTypes = {
  items: PropTypes.array,
  overlayClose: PropTypes.func,
};
