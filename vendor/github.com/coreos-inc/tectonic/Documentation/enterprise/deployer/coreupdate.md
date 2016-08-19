# CoreUpdate on Tectonic

This guide walks through deploying [CoreUpdate][coreupdate-tour] onto a Tectonic cluster.
After completing the steps in this guide, a deployer will have a fully-functioning instance of CoreUpdate, automating orderly system software updates to all of the machines in a cluster.

[coreupdate-tour]: https://coreos.com/products/coreupdate/

## Prerequisites

A PostgreSQL database must be available for CoreUpdate metadata storage.
We currently recommend running this database server outside of the cluster.

## Prepare Account Credentials

Visit your [Tectonic Account][tectonic-account] and download your Tectonic pull secret, saving it to a file named `tectonic-dockercfg`.
Base64-encode the contents of the newly-created dockercfg file, then replace the value of `{BASE64CFG}` in the following template and save the results in a file named `coreupdate-pull-secret.yml`:

```yaml
apiVersion: v1
kind: Secret
type: kubernetes.io/dockercfg
metadata:
  namespace: coreupdate
  name: coreupdate-pull-secret
data:
  .dockercfg: {BASE64CFG}
```

One can base64-encode on OS X or a Linux-based platform using the following bash command:

```
$ cat tectonic-dockercfg | base64 | tr -d '\n'
ewogInF1YXkuaW8iOiB7CiAgImF1dGgiOiAiYXNkZmFzZmRzYWRmc2Fmc2FkZmFzZGZzYWZzYWRmc2FmZHNhZmRzYWRmc2FkZnNhZGZzYWRmc2FkZiIsCiAgImVtYWlsIjogIiIKIH0KfQo=
```

[tectonic-account]: https://account.tectonic.com

## Build CoreUpdate Config

Use the [CoreUpdate configuration guide][coreupdate-config] to construct a config file for your CoreUpdate instance.

[coreupdate-config]: https://github.com/coreos/docs/blob/master/coreupdate/on-premises-deployment.md#configuration-file

It is important not to modify the value of `LISTEN_ADDRESS`.
This value must match what the Kubernetes pod and service objects expect.

If deploying CoreUpdate with TLS, additional modifications are documented later in this guide under [Advanced Configuration](#advanced-configuration).

This config can be changed in the future if any adjustments need to be made (see [Advanced Configuration](#advanced-configuration)).

## Render Config Secret

The config file created in the previous step is provided to the CoreUpdate application via a Kubernetes secret.
Base64-encode the contents of the newly-created config file, then replace the value of `{BASE64CFG}` in the following template and save the results in a file named `coreupdate-config-secret.yml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  namespace: coreupdate
  name: coreupdate-config-secret
data:
  config: {BASE64CFG}
```

## Deploy to Kubernetes

Download the following CoreUpdate configuration files for Kubernetes:

- [coreupdate-namespace.yml](files/coreupdate-namespace.yml)
- [coreupdate-app-rc.yml](files/coreupdate-app-rc.yml)

All Kubernetes objects will be deployed to the "coreupdate" namespace.
The first step is to create this namespace:

```sh
$ kubectl create -f coreupdate-namespace.yml
namespaces/coreupdate
```

Next, add your pull secret to Kubernetes:

```sh
$ kubectl create -f coreupdate-pull-secret.yml
secrets/coreupdate-pull-secret
```

Finally, deploy the remaining Kubernetes objects:

```sh
$ kubectl create -f coreupdate-config-secret.yml
secrets/coreupdate-config-secret
$ kubectl create -f coreupdate-app-rc.yml
replicationcontrollers/coreupdate-app
```

## Expose via Kubernetes Service

In order to access CoreUpdate, end users must route to it through a Kubernetes Service.
It is up to the deployer to decide which Service type is appropriate for their use case: a [LoadBalancer](http://kubernetes.io/v1.0/docs/user-guide/services.html#type-loadbalancer) or a [NodePort](http://kubernetes.io/v1.0/docs/user-guide/services.html#type-nodeport).

A LoadBalancer is recommended if Kubernetes is integrated with a supported cloud provider, otherwise a NodePort will suffice.
Examples of both types of services are included below.

### LoadBalancer

Using the [sample provided](files/coreupdate-service-loadbalancer.yml), a LoadBalancer Kubernetes Service can be created like so:

```sh
$ kubectl create -f coreupdate-service-loadbalancer.yml
services/coreupdate
```

kubectl can be used to find the externally-accessible URL of the `coreupdate` service.
For example, the value of `LoadBalancer Ingress` below is the public hostname of the CoreUpdate interface:

```sh
$ kubectl --namespace=coreupdate describe services coreupdate
Name:			coreupdate
Namespace:		coreupdate
Labels:			<none>
Selector:		coreupdate-component=app
Type:			LoadBalancer
IP:			10.3.0.13
LoadBalancer Ingress:	a673db89e7f4e11e582a90225b7c0e1e-329027073.us-west-1.elb.amazonaws.com
Port:			<unnamed>	80/TCP
NodePort:		<unnamed>	30658/TCP
Endpoints:		10.2.7.2:8000
Session Affinity:	None
No events.
```

### NodePort

Using the [sample provided](files/coreupdate-service-nodeport.yml), a NodePort Kubernetes Service can be created like so:

```sh
$ kubectl create -f coreupdate-service-nodeport.yml
services/coreupdate
```

By default, the `coreupdate` Kubernetes Service will be available on port 30002 on every node in the Kubernetes cluster.
If this port conflicts with an existing Kubernetes Service, simply modify the sample configuration file and change the value of NodePort.

## Advanced Configuration

### Securing CoreUpdate with TLS

Start by downloading the [alternate replication controller](files/coreupdate-app-tls-rc.yml) available alongside this guide.

This replication controller expects an additional secret named `coreupdate-tls-secret`.
The secret must contain a TLS certificate and key based on the following template:

```yaml
apiVersion: v1
kind: Secret
metadata:
  namespace: coreupdate
  name: coreupdate-tls-secret
data:
  cert: {BASE64CERT}
  key: {BASE64KEY}
```

Base64-encode the TLS certificate and key, replacing `{BASE64CERT}` and `{BASE64KEY}` in the above template, respectively.
Save this file as `coreupdate-tls-secret.yml`.

When you construct your CoreUpdate config file, be sure to set the following options:

```
TLS_CERT_FILE: /etc/coreupdate-tls/cert
TLS_KEY_FILE: /etc/coreupdate-tls/key
```

From here, continue with the normal deployment process, being sure to create the coreupdate-tls-secret in Kubernetes, and to use the alternate replication controller.
It is also suggested to use port 443 instead of port 80 when creating the necessary [Kubernetes service object](#expose-via-kubernetes-service).

### Reconfigure CoreUpdate

In the event that CoreUpdate needs to be reconfigured, take the following steps:

1. Make any changes to the CoreUpdate config file, then construct a new config secret based on the template used during the initial deploy.
2. Replace the existing config secret object in Kubernetes with the new object:

    ```sh
    $ kubectl replace -f coreupdate-config-secret.yml
    replicationcontrollers/coreupdate-app
    ```

3. Scale the replication controller down to zero, causing all existing pods to be destroyed:

    ```sh
    $ kubectl scale --namespace=coreupdate scale --replicas=0 rc coreupdate-app
    scaled
    ```
4. Now, scale the replication controller back up to size of one or more:

	```sh
	$ kubectl scale --namespace=coreupdate scale --replicas=1 rc coreupdate-app
	scaled
	```

At this point, CoreUpdate should be deployed using the new config secret.
