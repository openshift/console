import * as _ from 'lodash-es';
import * as React from 'react';

import * as denyOtherNamespacesImg from '../../imgs/network-policy-samples/1-deny-other-namespaces.svg';
import * as limitCertainAppImg from '../../imgs/network-policy-samples/2-limit-certain-apps.svg';
import * as allowIngressImg from '../../imgs/network-policy-samples/3-allow-ingress.svg';
import * as defaultDenyAllImg from '../../imgs/network-policy-samples/4-default-deny-all.svg';
import * as webAllowExternalImg from '../../imgs/network-policy-samples/5-web-allow-external.svg';
import * as webDbAllowAllNsImg from '../../imgs/network-policy-samples/6-web-db-allow-all-ns.svg';
import * as webAllowProductionImg from '../../imgs/network-policy-samples/7-web-allow-production.svg';
import { NetworkPolicyModel } from '../../models';
import { referenceForModel } from '../../module/k8s';
import { SampleYaml } from './resource-sidebar';

const samples = [
  {
    highlightText: 'Limit',
    header: 'access to the current namespace',
    img: denyOtherNamespacesImg,
    details: 'Deny traffic from other namespaces while allowing all traffic from the namespaces the Pod is living in.',
    templateName: 'deny-other-namespaces',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Limit',
    header: 'traffic to an application within the same namespace',
    img: limitCertainAppImg,
    details: 'Allow inbound traffic from only certain Pods. One typical use case is to restrict the connections to a database only to the specific applications.',
    templateName: 'db-or-api-allow-app',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Allow',
    header: 'http and https ingress within the same namespace',
    img: allowIngressImg,
    details: 'Define ingress rules for specific port numbers of an application. The rule applies to all port numbers if not specified.',
    templateName: 'api-allow-http-and-https',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Deny',
    header: 'all non-whitelisted traffic in the current namespace',
    img: defaultDenyAllImg,
    details: 'A fundamental policy by blocking all cross-pod traffics expect whitelisted ones through the other Network Policies being deployed.',
    templateName: 'default-deny-all',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Allow',
    header: 'traffic from external clients',
    img: webAllowExternalImg,
    details: 'Allow external service from public Internet directly or through a Load Balancer to access the pod.',
    templateName: 'web-allow-external',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Allow',
    header: 'traffic to an application from all namespaces',
    img: webDbAllowAllNsImg,
    details: 'One typical use case is for a common database which is used by deployments in different namespaces.',
    templateName: 'web-db-allow-all-ns',
    kind: referenceForModel(NetworkPolicyModel),
  },
  {
    highlightText: 'Allow',
    header: 'traffic from all pods in a particular namespace',
    img: webAllowProductionImg,
    details: 'Typical use case should be "only allow deployments in production namespaces to access the database" or "allow monitoring tools (in another namespace) to scrape metrics from current namespace."',
    templateName: 'web-allow-production',
    kind: referenceForModel(NetworkPolicyModel),
  },
];

export const NetworkPolicySidebar = ({loadSampleYaml, downloadSampleYaml}) => <ol className="co-resource-sidebar-list">
  {_.map(samples, (sample) => <SampleYaml
    key={sample.templateName}
    sample={sample}
    loadSampleYaml={loadSampleYaml}
    downloadSampleYaml={downloadSampleYaml} />)}
</ol>;
