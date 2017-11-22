# Monitoring & Graphs

## Prometheus

Data is collected by a Prometheus deployment. The Prometheus API is exposed through a service, which Console queries for data and transforms into a graph.

### Recording rules

Most of the queries used for the graphs are captured by recording rules in the [monitoring configmap](https://github.com/coreos-inc/tectonic/blob/master/installer/assets/monitoring/prometheus-configmap.yaml). These rules are used by nodes, namespaces, and pods, and get aggregated as such.

## Local Testing

Testing UI changes locally is best done by spinning up a cluster via the installer, pointing your local kubectl at it, and running the console locally. This way the configuration of Prometheus and data labeling are consistent with those of production clusters.

Alternatively, you can launch a [Minikube](https://github.com/kubernetes/minikube) or [Vagrant](https://github.com/coreos/coreos-kubernetes) cluster and mimic a real Tectonic deployment by `kubectl create`-ing the manifests in [tectonic/installer/assets](https://github.com/coreos-inc/tectonic/tree/master/installer/assets). **NOTE**: depending on what kind of system you created your cluster with, node metrics might not be queried correctly. Minikube usually works pretty well, however the Vagrant setup from coreos-kubernetes didn't always work for all nodes.
