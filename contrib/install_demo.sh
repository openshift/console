#!/bin/bash

# Uncomment these if you'd like to clean up
# kubectl delete --namespace=tectonic-dev services tectonic-console
# kubectl delete --namespace=tectonic-dev replicationcontrollers tectonic-console
# kubectl delete --namespace=tectonic-dev secrets tectonic-demo-pull-secret
# kubectl delete namespace tectonic-dev

if [ -z "$DOCKERCFG" ] || ! [ -f $DOCKERCFG ] ; then
    echo "Please provided a DOCKERCFG filename that can be used to pull the console"
    echo "(You can get a docker config from quay by joining an appropriate team.)"
    exit
fi

BASE64_ENCODED_DOCKERCFG=$(cat $DOCKERCFG | base64 | tr -d '\n','')

echo '
apiVersion: v1
kind: Namespace
metadata:
  name: tectonic-dev
' | kubectl create -f -

echo "
apiVersion: v1
kind: Secret
metadata:
  name: tectonic-demo-pull-secret
  namespace: tectonic-dev
data:
  .dockercfg: $BASE64_ENCODED_DOCKERCFG
type: kubernetes.io/dockercfg
" | kubectl create -f -

echo '
---
apiVersion: v1
kind: Service
metadata:
  labels:
    tectonic-app: console
    tectonic-component: ui
  name: tectonic-console
  namespace: tectonic-dev
spec:
  ports:
    - name: tectonic-console
      nodePort: 30001
      port: 80
      protocol: TCP
      targetPort: 80
  selector:
    tectonic-app: console
    tectonic-component: ui
  sessionAffinity: None
  type: NodePort
---
apiVersion: v1
kind: ReplicationController
metadata:
  labels:
    tectonic-app: console
    tectonic-component: ui
  name: tectonic-console
  namespace: tectonic-dev
spec:
  replicas: 1
  selector:
    tectonic-app: console
    tectonic-component: ui
  template:
    metadata:
      labels:
        tectonic-app: console
        tectonic-component: ui
      name: tectonic-console
      namespace: tectonic-dev
    spec:
      containers:
        - command:
            - sh
            - "-c"
            - "/opt/bridge/bin/bridge"
          env:
            - name: BRIDGE_K8S_IN_CLUSTER
              value: "true"
            - name: BRIDGE_LISTEN
              value: http://0.0.0.0:80
            - name: BRIDGE_HOST
              value: "http://example.com/dummy-value"
            - name: BRIDGE_DISABLE_AUTH
              value: "true"
            - name: BRIDGE_PUBLIC_DIR
              value: /opt/bridge/static
            - name: BRIDGE_TECTONIC_VERSION
              value: e370b1c4fce55499e933f948dc3eb18ded4a91e0
          image: quay.io/coreos/tectonic-console:8ba17e0a322f1c83bd8900f15ea92461f84dd360
          imagePullPolicy: IfNotPresent
          name: tectonic-console
          ports:
            - containerPort: 80
              protocol: TCP
          resources:
            limits:
              cpu: 50m
              memory: 50Mi
          terminationMessagePath: /dev/termination-log
      dnsPolicy: ClusterFirst
      imagePullSecrets:
        - name: tectonic-demo-pull-secret
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
' | kubectl create -f -
