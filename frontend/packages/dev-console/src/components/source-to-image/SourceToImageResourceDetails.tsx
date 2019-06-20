import * as React from 'react';

const SourceToImageResourceDetails: React.FC = () => (
  <React.Fragment>
    <hr />
    <p>The following resources will be created:</p>
    <ul>
      <li>
        A <span className="co-catalog-item-details__kind-label">build config</span> to build source
        from a Git repository.
      </li>
      <li>
        An <span className="co-catalog-item-details__kind-label">image stream</span> to track built
        images.
      </li>
      <li>
        A <span className="co-catalog-item-details__kind-label">deployment config</span> to rollout
        new revisions when the image changes.
      </li>
      <li>
        A <span className="co-catalog-item-details__kind-label">service</span> to expose your
        workload inside the cluster.
      </li>
      <li>
        An optional <span className="co-catalog-item-details__kind-label">route</span> to expose
        your workload outside the cluster.
      </li>
    </ul>
  </React.Fragment>
);

export default SourceToImageResourceDetails;
