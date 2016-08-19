# Upgrading Tectonic

Before upgrading Tectonic we recommend you [upgrade Kubernetes](https://github.com/coreos/coreos-kubernetes/blob/master/Documentation/kubernetes-upgrade.md).

The current upgrade strategy for Tectonic is a manual process.
There are two upgrade options:

## In-Place Upgrade

- [From Tectonic 1.0 to Tectonic 1.1](upgrade_1-1.md)


## Clean Re-Install

Tectonic components can be safely deleted and re-installed using standard Kubernetes tools.

First, delete the Tectonic Manager first using kubectl:

```
kubectl delete --namespace=tectonic-system replicationControllers tectonic-manager
```

Next, delete all remaining Tectonic objects using kubectl:

```
kubectl delete --namespace=tectonic-system --all services
kubectl delete --namespace=tectonic-system --all replicationControllers
kubectl delete --namespace=tectonic-system --all secrets
kubectl delete namespace tectonic-system
```

Finally, install the latest version of Tectonic [using the deployer guide][deployer-guide]

[deployer-guide]: https://tectonic.com/docs/latest/deployer/
