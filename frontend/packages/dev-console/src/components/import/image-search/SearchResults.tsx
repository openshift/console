import * as React from 'react';
import * as _ from 'lodash';
import { Timestamp, units } from '@console/internal/components/utils';
import { Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';

const runsAsRoot = (image) => {
  const user = _.get(image, 'dockerImageMetadata.Config.User');
  return !user || user === '0' || user === 'root';
};

const SearchResults: React.FC = () => {
  const { values } = useFormikContext<FormikValues>();

  const ImagePorts = ({ ports }) => (
    <React.Fragment>
      {_.size(ports) > 1 ? 'Ports ' : 'Port '}
      {_.map(ports, (port) => `${port.containerPort}/${port.protocol.toUpperCase()}`).join(
        ', ',
      )}{' '}
      will be load balanced by Service <strong>{values.name || '<name>'}</strong>.
      <div>
        Other containers can access this service through the hostname{' '}
        <strong>{values.name || '<name>'}</strong>.
      </div>
    </React.Fragment>
  );

  return !_.isEmpty(values.isi.image) ? (
    <div className="co-image-name-results">
      <div className="co-image-name-results__details">
        {runsAsRoot(values.isi.image) && (
          <Alert isInline className="co-alert" variant="warning" title="Image runs as root">
            Image <strong>{values.isi.name}</strong> runs as the <strong>root</strong> user which
            might not be permitted by your cluster administrator.
          </Alert>
        )}
        <div className="row">
          <div className="col-sm-3 col-md-2 hidden-xs text-right h2">
            <span
              className="fa fa-cube text-muted"
              style={{ fontSize: '100px' }}
              aria-hidden="true"
            />
          </div>
          <div className="col-sm-9 col-md-10">
            <h2 className="co-image-name-results__heading co-break-word">
              {values.isi.name}
              <small>
                {_.get(values.isi, 'result.ref.registry') && (
                  <span>from {values.isi.result.ref.registry}, </span>
                )}
                <Timestamp timestamp={values.isi.image.dockerImageMetadata.Created} />,{' '}
                {_.get(values.isi, 'image.dockerImageMetadata.Size') && (
                  <span>
                    {
                      units.humanize(values.isi.image.dockerImageMetadata.Size, 'binaryBytes', true)
                        .string
                    }
                    ,{' '}
                  </span>
                )}
                {_.size(values.isi.image.dockerImageLayers)} layers
              </small>
            </h2>
            <ul>
              {!values.isi.namespace && (
                <li>
                  Image Stream{' '}
                  <strong>
                    {values.name || '<name>'}:{values.isi.tag || 'latest'}
                  </strong>{' '}
                  will track this image.
                </li>
              )}
              <li>
                This image will be deployed in Deployment Config{' '}
                <strong>{values.name || '<name>'}</strong>.
              </li>
              {values.ports && (
                <li>
                  <ImagePorts ports={values.ports} />
                </li>
              )}
            </ul>
            {!_.isEmpty(values.isi.image.dockerImageMetadata.Config.Volumes) && (
              <p className="help-block">
                This image declares volumes and will default to use non-persistent, host-local
                storage. You can add persistent storage later to the deployment config.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default SearchResults;
