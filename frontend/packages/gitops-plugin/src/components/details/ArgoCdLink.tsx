import * as React from 'react';
import { SplitItem } from '@patternfly/react-core';
import { ExternalLink } from '@console/internal/components/utils';
import * as argoIcon from '../../images/argo.png';

type ArgoCdLinkProps = {
  envName: string;
  appName: string;
  argocdLink: any;
};

const ArgoCdLink: React.FC<ArgoCdLinkProps> = ({ envName, appName, argocdLink }) => {
  // Use environment name as is or the original KAM-based design
  const appNameLink = envName.includes(appName) ? envName : `${envName}-${appName}`;
  return (
    <SplitItem className="gitops-plugin__environment-details__env-section__deployment-history__argocd-link">
      <ExternalLink href={`${argocdLink.spec.href}/applications/${appNameLink}`}>
        <span className="gitops-plugin__environment-details__env-section__argo-external-link">
          <img loading="lazy" src={argoIcon} alt="Argo CD" width="19px" height="24px" />
        </span>
      </ExternalLink>
    </SplitItem>
  );
};

export default ArgoCdLink;
