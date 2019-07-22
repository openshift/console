import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {Modal} from 'patternfly-react';
import {CatalogItemHeader, PropertiesSidePanel, PropertyItem} from 'patternfly-react-extensions';

import {normalizeIconClass} from './catalog-item-icon';
import {ClusterServicePlanModel} from '../../models';
import {SourceToImageResourceDetails} from '../source-to-image';
import {k8sGet} from '../../module/k8s';
import {Timestamp, ExternalLink} from '../utils';

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
    k8sGet(ClusterServicePlanModel, null, null, {queryParams: { fieldSelector: `spec.clusterServiceClassRef.name=${obj.metadata.name}`} })
      .then(({items: plans}) => {
        this.setState({
          plans: _.orderBy(plans, ['spec.externalMetadata.displayName', 'metadata.name']),
        });
      });
  }

  render() {
    const { closeOverlay } = this.props;
    const { obj,
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
      sampleRepo } = this.props.item;
    const { plans } = this.state;

    const vendor = tileProvider ? `Provided by ${tileProvider}` : null;
    const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
    const creationTimestamp = _.get(obj, 'metadata.creationTimestamp');

    const supportUrlLink = <ExternalLink href={supportUrl} text="Get Support" />;
    const documentationUrlLink = <ExternalLink href={documentationUrl} additionalClassName="co-break-all" text={documentationUrl} />;
    const sampleRepoLink = <ExternalLink href={sampleRepo} additionalClassName="co-break-all" text={sampleRepo} />;
    const planItems = _.map(plans, plan => <li key={plan.metadata.uid}>{plan.spec.description || plan.spec.externalName}</li>);

    return (
      <React.Fragment>
        <Modal.Header>
          <Modal.CloseButton onClick={closeOverlay} />
          <CatalogItemHeader
            title={tileName}
            vendor={vendor}
            iconClass={iconClass}
            iconImg={tileImgUrl} />
        </Modal.Header>
        <Modal.Body>
          <div className="modal-body-content">
            <div className="modal-body-inner-shadow-covers">
              <div className="co-catalog-page__overlay-body">
                <PropertiesSidePanel>
                  <Link className="pf-c-button pf-m-primary co-catalog-page__overlay-create" to={href} role="button" title={this.props.item.createLabel} onClick={closeOverlay}>{this.props.item.createLabel}</Link>
                  {tileProvider && <PropertyItem label="Provider" value={tileProvider} />}
                  {supportUrl && <PropertyItem label="Support" value={supportUrlLink} />}
                  {creationTimestamp && <PropertyItem label="Created At" value={<Timestamp timestamp={creationTimestamp} />} />}
                </PropertiesSidePanel>
                <div className="co-catalog-page__overlay-description">
                  {tileDescription && <p>{tileDescription}</p>}
                  {longDescription && <p>{longDescription}</p>}
                  {sampleRepo && <p>Sample repository: {sampleRepoLink}</p>}
                  {documentationUrl && <React.Fragment>
                    <h2 className="h5">Documentation</h2>
                    <p>{documentationUrlLink}</p>
                  </React.Fragment>}
                  {!_.isEmpty(plans) && <React.Fragment>
                    <h2 className="h5">Service Plans</h2>
                    <ul>
                      {planItems}
                    </ul>
                  </React.Fragment>}
                  {kind === 'ImageStream' && <SourceToImageResourceDetails />}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </React.Fragment>
    );
  }
}

CatalogTileDetails.displayName = 'CatalogTileDetails';
CatalogTileDetails.propTypes = {
  items: PropTypes.array,
  overlayClose: PropTypes.func,
};
