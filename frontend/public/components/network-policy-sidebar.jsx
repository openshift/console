import * as React from 'react';
import { registerTemplate } from '../yaml-templates';

import * as denyOtherNamespacesImg from '../imgs/network-policy-samples/1-deny-other-namespaces.svg';
import * as limitCertainAppImg from '../imgs/network-policy-samples/2-limit-certain-apps.svg';
import * as allowIngressImg from '../imgs/network-policy-samples/3-allow-ingress.svg';
import * as defaultDenyAllImg from '../imgs/network-policy-samples/4-default-deny-all.svg';
import * as webAllowExternalImg from '../imgs/network-policy-samples/5-web-allow-external.svg';
import * as webDbAllowAllNsImg from '../imgs/network-policy-samples/6-web-db-allow-all-ns.svg';
import * as webAllowProductionImg from '../imgs/network-policy-samples/7-web-allow-production.svg';

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-other-namespaces
  namespace: target-ns
spec:
  podSelector:
  ingress:
  - from:
    - podSelector: {}
`, 'deny-other-namespaces');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-or-api-allow-app
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      role: db
  ingress:
    - from:
      - podSelector:
        matchLabels:
        app: mail
`, 'db-or-api-allow-app');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-http-and-https
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
  - from:
    - podSelector:
        matchLabels:
        role: monitoring
  - ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
`, 'api-allow-http-and-https');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: target-ns
spec:
  podSelector:
`, 'default-deny-all');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-allow-external
  namespace: target-ns
spec:
  podSelector:
  matchLabels:
    app: web
  ingress:
  - {}
`, 'web-allow-external');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-db-allow-all-ns
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      role: web-db
  ingress:
    - from:
      - namespaceSelector: {}
`, 'web-db-allow-all-ns');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-allow-production
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
    - from:
      - namespaceSelector:
        matchLabels:
        env: production
`, 'web-allow-production');

export const NetworkPolicySidebar = ({loadSampleYaml, downloadSampleYaml}) => <div className="co-p-cluster__sidebar">
  <div className="co-network-sidebar co-m-pane__body">
    <h1 className="co-p-cluster__sidebar-heading co-network-policy-sidebar-header text-capitalize">Network policy samples</h1>
    <ol className="co-network-policy-sidebar-list">
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header">
          <span className="text-uppercase">Limit</span> access to the current namespace
        </h5>
        <img src={denyOtherNamespacesImg} />
        <p className="co-network-policy-sidebar-item__details">
          Deny traffic from other namespaces while allowing all traffic from the namespaces the  <span className="text-capitalize">pod</span> is living in.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('deny-other-namespaces')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('deny-other-namespaces')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header">
          <span className="text-uppercase">Limit</span> traffic to an application within the same namespace
        </h5>
        <img src={limitCertainAppImg} />
        <p className="co-network-policy-sidebar-item__details">
          Allow inbound traffic from only certain <span className="text-capitalize">pods</span>. One typical use case is to restrict the connections to a database only to the specific applications.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('db-or-api-allow-app')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('db-or-api-allow-app')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header"><span className="text-uppercase">Allow</span> http and https ingress within the same namespace</h5>
        <img src={allowIngressImg} />
        <p className="co-network-policy-sidebar-item__details">
          Define ingress rules for specific port numbers of an application. The rule applies to all port numbers if not specified.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('api-allow-http-and-https')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('api-allow-http-and-https')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header">
          <span className="text-uppercase">Deny</span> all non-whitelisted traffic in the current namespace
        </h5>
        <img src={defaultDenyAllImg} />
        <p className="co-network-policy-sidebar-item__details">
          A fundamental policy by blocking all cross-pod traffics expect whitelisted ones through the other <span className="text-capitalize">network policies</span> being deployed.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('default-deny-all')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('default-deny-all')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5><span className="text-uppercase">Allow</span> traffic from external clients</h5>
        <img src={webAllowExternalImg} />
        <p className="co-network-policy-sidebar-item__details">
          Allow external service from public <span className="text-capitalize">internet</span> directly or through a <span className="text-capitalize">load balancer</span> to access the pod.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('web-allow-external')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('web-allow-external')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header">
          <span className="text-uppercase">Allow</span> traffic to an application from all namespaces
        </h5>
        <img src={webDbAllowAllNsImg} />
        <p className="co-network-policy-sidebar-item__details">
          One typical use case is for a common database which is used by deployments in different namespaces.
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('web-db-allow-all-ns')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('web-db-allow-all-ns')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
      <li className="co-network-policy-sidebar-item">
        <h5 className="co-network-policy-sidebar-item__header">
          <span className="text-uppercase">Allow</span> traffic from all pods in a particular namespace
        </h5>
        <img src={webAllowProductionImg} />
        <p className="co-network-policy-sidebar-item__details">
          Typical use case should be &#34;only allow deployments in production namespaces to access the database&#59;&#34; or &#34;allow monitoring tools &#40;in another namespace&#41; to scrape metrics from current namespace.&#34;
        </p>
        <button className="btn btn-link" onClick={() => loadSampleYaml('web-allow-production')}>
          <span className="fa fa-fw fa-paste"></span> Try this policy
        </button>
        <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml('web-allow-production')}>
          <span className="fa fa-fw fa-download"></span> Download this yaml
        </button>
      </li>
    </ol>
  </div>
</div>;
