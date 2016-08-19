# Getting Started with Tectonic Console

Tectonic Console monitors and manages a Kubernetes cluster from any web browser. This document describes the installation of and initial access to Console.

<div class="row">
  <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12">
    <div class="co-m-screenshot">
      <img src="https://tectonic.com/assets/images/screenshots/replica-set-detail.png" alt="Tectonic Console" />
      <div class="co-m-screenshot-caption">Replica Set Detail in the Tectonic Console</div>
    </div>
  </div>
</div>

Before beginning the steps below, [download and configure `kubectl`][kubectl-instructions], the Kubernetes cluster administration program. Invoking `kubectl get nodes` on your workstation should produce output similar to the following:


```sh
$ kubectl get nodes
NAME           LABELS                                STATUS    AGE
172.17.4.201   kubernetes.io/hostname=172.17.4.201   Ready     12s
```

If you see a message like `command not found` or `error: couldn't read version from server` in response to `kubectl get nodes`, you'll need to adjust your kubectl configuration and cluster setup before you can follow these instructions.

Once you've set up your cluster and `kubectl`, getting up and running with Tectonic Console is a four step process. You'll need to:

1. Download a coreos pull secret
1. Install the pull secret
1. Install Tectonic Console
1. View Tectonic Console

## Download a Console pull secret

Tectonic Console is available for free at [account.tectonic.com][account-tectonic]. After registering for Tectonic Starter, you will download a file that contains a password your cluster will use when downloading the Tectonic Console image. The file contains a Kubernetes-formatted *pull secret*, which specifies credentials that Kubernetes will use to pull the image down from a container registry.

You can find your pull secret on the main screen after logging in, under "Account Assets". There are several formats of the secret, be sure to download the Kubernetes-formatted file. Your account also has a universal software license, which is not required to use the Console.

## Install the pull secret

Once you've downloaded your pull secret file from your Tectonic Account, you can add it to your cluster using `kubectl create`, like this:

```sh
$ kubectl create -f coreos-pull-secret.yml
secret "coreos-pull-secret" created
```

Kubernetes will read the file and create a [secret][k8s-secret] that it will use later to retrieve Console.

## Install Tectonic Console

With the pull secret added to Kubernetes, download the [Tectonic Console manifest][console-manifest] that defines a Kubernetes [Deployment][k8s-deployment] that pulls, runs, and maintains the Console container throughout its lifecycle on the cluster. Upload the Tectonic Console manifest to the cluster with another invocation of `kubectl create`:

```sh
$ kubectl create -f tectonic-console.yaml
replicationcontroller "tectonic-console" created
```

The pull secret you installed into your cluster can be used to pull the Console container image from the Internet.

You can check to see if Console is up and running with the following command:

```sh
$ kubectl get pods -l app=tectonic-console
NAME                     READY     STATUS    RESTARTS   AGE
tectonic-console-fh23a   1/1       Running   0          3m
```

As you can see, our deployment created a single pod called `tectonic-console-1133420111-qydsv`. It can take a second for this container to move from Pending to Ready as the container is downloaded from CoreOS' container registry, Quay.io. If you'd like, you can "watch" the pod status in real time:

```sh
$ kubectl get pods --watch -l app=tectonic-console
NAME                                READY     STATUS    RESTARTS   AGE
tectonic-console-1133420111-qydsv   0/1       Pending   0          0s
tectonic-console-1133420111-qydsv   0/1       Pending   0         0s
tectonic-console-1133420111-qydsv   0/1       ContainerCreating   0         0s
tectonic-console-1133420111-qydsv   1/1       Running   0         2s
```

## Viewing Tectonic Console

Tectonic Console allows users to create, manage, and destroy most fundamental cluster objects. The Console in Tectonic Starter does not authenticate users, so this interface isn't exposed outside of the cluster. To access the Console, it is necessary to arrange port forwarding from your workstation to the Console service port. The following [script to forward ports to Console][port-forward-script] is a simple way to accomplish this. It queries the Kubernetes API for a pod labelled `app=tectonic-console`, then forwards port 9000 on the host where it is run to port 9000 on that pod.

{% raw %}
```sh
$ kubectl get pods -l app=tectonic-console -o template --template="{{range.items}}{{.metadata.name}}{{end}}" | xargs -I{} kubectl port-forward {} 9000
I0125 13:13:36.032417    3961 portforward.go:213] Forwarding from 127.0.0.1:9000 -> 9000
I0125 13:13:36.032513    3961 portforward.go:213] Forwarding from [::1]:9000 -> 9000
```
{% endraw %}

Once port forwarding is set up, access Console by visiting http://localhost:9000 in a web browser on your workstation. You can now monitor and manage the cluster with Tectonic Console. If you're interested in additional authentication support, [Tectonic Enterprise][tectonic-enterprise] has options for connecting Tectonic to Google Apps, LDAP, and more.

## Removing the console

If you'd like to remove the console from your cluster, you can do it quickly with two commands - one that will remove the pull secret you got from account.tectonic.com, and the other that removes the deployment that manages the console:

```sh
$ kubectl delete deployment tectonic-console
deployment "tectonic-console" deleted

$ kubectl delete secrets coreos-pull-secret
secret "coreos-pull-secret" deleted
```

[console-manifest]: files/tectonic-console.yaml
[k8s-deployment]: http://kubernetes.io/docs/user-guide/deployments/
[k8s-secret]: http://kubernetes.io/v1.1/docs/user-guide/secrets.html
[kubectl-instructions]: https://coreos.com/kubernetes/docs/latest/configure-kubectl.html
[port-forward-script]: scripts/port_forward_console.sh
[tectonic-enterprise]: https://tectonic.com/enterprise/
[account-tectonic]: https://account.tectonic.com/signup/summary/tectonic-starter
