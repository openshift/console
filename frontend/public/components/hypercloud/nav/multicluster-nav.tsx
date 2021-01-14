import * as React from 'react';
import { NavItemSeparator } from '@patternfly/react-core';
// import { referenceForModel } from '../../module/k8s';
// import { ExternalLink, HrefLink, ResourceNSLink, ResourceClusterLink } from './items';
import { ResourceClusterLink } from '../../nav/items';
import { NavSection } from '../../nav/section';

type SeparatorProps = {
  name: string;
  required?: string;
};

const Separator: React.FC<SeparatorProps> = ({ name }) => <NavItemSeparator name={name} />;

const MulticlusterNav = () => (
  <>
    <ResourceClusterLink resource="clustermanagers" name="Clusters" />
    <ResourceClusterLink resource="clusterclaims" name="Clusters Claims" />
    {/* <ResourceClusterLink resource="clustergroups" name="Cluster Groups" /> */}
    <NavSection title="Federation">
      <h3 style={{ paddingLeft: '28px' }}>Workloads</h3>
      <ResourceClusterLink resource="federatedpods" name="Pods" />
      <ResourceClusterLink resource="federateddeployments" name="Deployments" />
      <ResourceClusterLink resource="federatedreplicasets" name="Replica Sets" />
      <ResourceClusterLink resource="federatedhorizontalpodautoscalers" name="Horizontal Pod Autoscalers" />
      <ResourceClusterLink resource="federateddaemonsets" name="Daemon Sets" />
      <ResourceClusterLink resource="federatedstatefulsets" name="Stateful Sets" />
      <ResourceClusterLink resource="federatedconfigmaps" name="Config Maps" />
      <ResourceClusterLink resource="federatedsecrets" name="Secrets" />
      <ResourceClusterLink resource="federatedjobs" name="Jobs" />
      <ResourceClusterLink resource="federatedcronjobs" name="Cron Jobs" />
      <Separator name="WorkloadsSeparator" />
      <h3 style={{ paddingLeft: '28px' }}>Network</h3>
      <ResourceClusterLink resource="federatedingresses" name="Ingresses" />
      <ResourceClusterLink resource="federatedservices" name="Services" />
      <Separator name="NetworksSeparator" />
      <h3 style={{ paddingLeft: '28px' }}>Management</h3>
      <ResourceClusterLink resource="federatednamespaces" name="Namespaces" />
    </NavSection>
    {/* <NavSection title="Image">
      <ResourceClusterLink resource="federatedregistries" name="Registry" />
      <ResourceClusterLink resource="federatedimagesigners" name="Image Signer" />
      <ResourceClusterLink resource="federatedimagesignrequests" name="Image Sign Request" />
      <ResourceClusterLink resource="federatedimagetransfers" name="Image Transfer" />
    </NavSection> */}
  </>
);

export default MulticlusterNav;
