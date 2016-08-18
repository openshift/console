# Getting Started with Tectonic Lab

Tectonic manages, monitors, and secures Kubernetes clusters. [Tectonic Lab](https://tectonic.com/lab) is a collection of the essential Tectonic components that allows you to quickly develop, test, and internally deploy application containers on Tectonic. Lab comes complete with access to customer support from the Tectonic team at CoreOS.

## Installation steps

To get up and running with your Lab environment, follow the following steps:

1. [Deploy a Kubernetes cluster][k8s-deploy].

2. [Install the Tectonic Console][console-install] on the cluster.

3. [Install Quay Enterprise][qe-install] local container registry on your cluster.

Visit [Tectonic Support][tectonic-support] for advice and help if you run into trouble.

## Testing out your cluster

After your cluster is up and running, the [Kubernetes Guestbook demo][k8s-guestbook] is a quick way to evaluate the container deployment and monitoring features of Tectonic. As your evaluation advances, deploying applications from a Quay Enterprise repository and experimenting with automated deployment and scaling is a solid next step.

<div class="co-m-docs-next-step">
  <p><strong>Do you have a Kubernetes cluster?</strong> Tectonic depends on a Kubernetes cluster.</p>
  <a href="{{site.baseurl}}/enterprise/docs/latest/deployer/tectonic_console.html" class="btn btn-default btn-icon-right"  data-category="Docs Next" data-event="Enterprise: Console">Yes, ready to deploy the Console</a>
  <a href="https://coreos.com/kubernetes/docs/latest/#deployment" class="btn btn-default btn-icon-right"  data-category="Docs Next" data-event="Kubernetes: Master">No, need to deploy Kubernetes</a>
</div>

[console-install]: {{site.baseurl}}/enterprise/docs/latest/deployer/tectonic_console.html
[k8s-deploy]: https://coreos.com/kubernetes/docs/latest/#installation
[qe-install]: {{site.baseurl}}/enterprise/docs/latest/deployer/quay_enterprise.html
[tectonic-support]: https://account.tectonic.com/support
[k8s-guestbook]: https://github.com/kubernetes/kubernetes/tree/release-1.1/examples/guestbook-go