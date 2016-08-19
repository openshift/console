# Tectonic End-User Guide

End-users of Tectonic are expected to deploy applications directly in Kubernetes.
For first-time users of Kubernetes, familiarize yourself with the building blocks of Kubernetes:

* [Overview of Pods][overview-pods]
* [Overview of Replication Controllers][overview-rc]
* [Overview of Services][overview-services]

[overview-pods]: https://coreos.com/kubernetes/docs/latest/pods.html
[overview-rc]: https://coreos.com/kubernetes/docs/latest/replication-controller.html
[overview-services]: https://coreos.com/kubernetes/docs/latest/services.html

Your application's architecture will drive how you assemble these components together.

## Interacting with Kubernetes

Tectonic supports three different methods of interacting with Kubernetes:

1. Tectonic Console
2. kubectl CLI tool
3. Kubernetes API

See below for more information on how to use each of these.

## End-User Access Control

The primary method of access control for Kubernetes is client certificates issued to you by your administrator. These certificates can be used to access the Kubernetes API and configured for use with `kubectl`.

### Tectonic Console

The Tectonic Console gives end-users an easy-to-navigate view of the live event stream and workload of the Tectonic cluster. By default, the Console is not exposed to the internet, and your administrator may have placed it behind a VPN or other restricted location.

<div class="row">
  <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-8 col-md-offset-1 col-xs-12 co-m-screenshot">
    <img src="{{site.baseurl}}/assets/images/screenshots/replication-controller-list.png" class="img-center" />
    <div align="center" class="co-m-screenshot-caption caption">Tectonic Console showing replication controllers</div>
  </div>
</div>

### kubectl CLI tool

End-users more familiar with command-line tools will find `kubectl` a productive method of deploying their Kubernetes-aware applications.
In order to use kubectl, an end-user must be issued client certificates to the Kubernetes API by an administrator.

[Configure your local Kubernetes client][config-kubectl] using the following commands:

* Replace `${MASTER_IP}` with the Kubernetes API location
* Replace `${CA_CERT}` with the path to the `ca.pem` managed by the administrator
* Replace `${USER_KEY}` with the path to the `user-key.pem` issued by the administrator
* Replace `${USER_CERT}` with the path to the `user.pem` issued by the administrator

```sh
$ kubectl config set-cluster vagrant --server=https://${MASTER_IP}:443 --certificate-authority=${CA_CERT}
$ kubectl config set-credentials vagrant-user --certificate-authority=${CA_CERT} --client-key=${USER_KEY} --client-certificate=${USER_CERT}
$ kubectl config set-context vagrant --cluster=vagrant --user=vagrant-user
$ kubectl config use-context vagrant
```

Once kubectl is properly configured, it can be used to explore Kubernetes entities:

```
$ kubectl get nodes
NAME         LABELS                              STATUS
10.0.0.197   kubernetes.io/hostname=10.0.0.197   Ready
10.0.0.198   kubernetes.io/hostname=10.0.0.198   Ready
10.0.0.199   kubernetes.io/hostname=10.0.0.199   Ready
```

[config-kubectl]:https://coreos.com/kubernetes/docs/latest/configure-kubectl.html

### Kubernetes API

An end-user may integrate external tools and applications with Kubernetes directly via a swagger-based API.
After being issued certificates to the Kubernetes API by an administrator, an end-user should be able to make direct API requests.

See the [upstream documentation](https://github.com/kubernetes/kubernetes/blob/release-1.0/docs/api.md#the-kubernetes-api) for more information about the API semantics.

