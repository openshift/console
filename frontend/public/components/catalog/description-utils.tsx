import * as React from 'react';
import * as _ from 'lodash';
import { PropertyItem } from '@patternfly/react-catalog-view-extension';
import { ExternalLink, ExpandCollapse } from '../utils';
import { Plan } from './types';

export const SampleRepoLink: React.FC<{ link: string }> = ({ link }) =>
  link ? (
    <p>
      Sample repository: <ExternalLink href={link} additionalClassName="co-break-all" text={link} />
    </p>
  ) : null;

export const DocumentationUrlLink: React.FC<{ link: string }> = ({ link }) =>
  link ? (
    <>
      <h2 className="h5">Documentation</h2>
      <p>
        <ExternalLink href={link} additionalClassName="co-break-all" text={link} />
      </p>
    </>
  ) : null;

export const PlanItems: React.FC<{ plans: Plan[] }> = ({ plans }) =>
  !_.isEmpty(plans) ? (
    <>
      <h2 className="h5">Service Plans</h2>
      <ul>
        {plans.map((plan) => (
          <li key={plan.metadata?.uid}>{plan.spec?.description || plan.spec?.externalName}</li>
        ))}
      </ul>
    </>
  ) : null;

export const SupportUrlLink: React.FC<{ link: string }> = ({ link }) =>
  link ? (
    <PropertyItem label="Support" value={<ExternalLink href={link} text="Get support" />} />
  ) : null;

export const ImageStreamText: React.FC<{}> = () => (
  <>
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
  </>
);

type ExpandCollapseDescriptionProps = {
  children: React.ReactNode;
};

export const ExpandCollapseDescription: React.FC<ExpandCollapseDescriptionProps> = ({
  children,
}) => {
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const toggle = (isExpanded) => {
    setExpanded(isExpanded);
  };
  return (
    <ExpandCollapse
      textExpanded="Hide operator description"
      textCollapsed="Show operator description"
      onToggle={toggle}
    >
      {/**used an empty Fragment here because Expandable always expects a children, using null throws react warning */}
      {expanded ? children : <></>}
    </ExpandCollapse>
  );
};
