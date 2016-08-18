# Upgrading to Tectonic 1.1

The steps below make use of `kubectl`. The same steps can be done via the Tectonic Console UI.

All kubectl commands assume that your namespace is set to the Tectonic namespace, eg. `tectonic-system`. You can configure this by changing your kubectl context:

```
$ kubectl config set-context <name> --namespace=tectonic-system
```

## Delete Tectonic components

1\. Delete the tectonic-manager Replication Controller. 

```sh
$ kubectl delete rc tectonic-manager
```

2\. Wait for the tectonic-manager pod to be descheduled.

```sh
$ kubectl get pod -l tectonic-app=manager
NAME                     READY     STATUS    RESTARTS   AGE
tectonic-manager-tutce   1/1       Running   0          18h
```

When it's gone, you'll see:

```sh
$ kubectl get pod -l tectonic-app=manager
NAME      READY     STATUS    RESTARTS   AGE
```

3\. Delete the rest of the Tectonic Replication Controllers.

```sh
$ kubectl delete rc tectonic-console
$ kubectl delete rc tectonic-identity-overlord
$ kubectl delete rc tectonic-identity-worker
$ kubectl delete rc tectonic-support
```

4\. Wait for all the pods from these Replication Controllers to be descheduled.

```sh
$ kubectl get pod -l tectonic-app
NAME                               READY     STATUS    RESTARTS   AGE
tectonic-console-z1qgu             1/1       Running   0          18h
tectonic-identity-overlord-ngtem   1/1       Running   0          18h
tectonic-identity-worker-oofrl     1/1       Running   0          18h
tectonic-support-lctma             1/1       Running   0          18h
```

Afterwards, you'll see no pods matching the `tectonic-app` label:

```sh
$ kubectl get pod -l tectonic-app
NAME                               READY     STATUS    RESTARTS   AGE
```

## Install new Tectonic version

1\. Create a Replication Controller for the new `tectonic-manager` Note: if you are not using `tectonic-system` as the Tectonic namespace, be sure to make the appropriate substitution.

```sh
$ TECTONIC_NAMESPACE=tectonic-system
$ kubectl create -f - <<EOF
apiVersion: v1
kind: ReplicationController
metadata:
  name: tectonic-manager
  namespace: $TECTONIC_NAMESPACE
spec:
  replicas: 1
  selector:
    tectonic-app: manager
  template:
    metadata:
      labels:
        tectonic-app: manager
    spec:
      containers:
      - image: quay.io/tectonic/manager:v0.5.7
        name: tectonic-manager
        env:
        - name: TECTONIC_MANAGER_IMAGE
          value: quay.io/tectonic/manager:v0.5.7
        volumeMounts:
        - mountPath: /etc/tectonic-license/
          name: tectonic-license
      volumes:
      - secret:
          secretName: tectonic-license
        name: tectonic-license
EOF
```

2\. Once the console is running again, you can log into the console.

```sh
$ kubectl get pod -l tectonic-app=console
NAME                     READY     STATUS    RESTARTS   AGE
tectonic-console-z1qgu   1/1       Running   0          19h
```
