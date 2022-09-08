import { Map as ImmutableMap } from 'immutable';

import { GroupVersionKind, referenceForModel, referenceForExtensionModel } from '../module/k8s';
import * as k8sModels from '../models';
import * as appModels from '@console/app/src/models/';
import { YAMLTemplate } from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { PodDisruptionBudgetModel } from '@console/app/src/models';

/**
 * Sample YAML manifests for some of the statically-defined Kubernetes models.
 */

export const baseTemplates = ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
  .setIn(
    ['DEFAULT', 'default'],
    `
apiVersion: ''
kind: ''
metadata:
  name: example
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'default'],
    `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: example
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: db
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          project: myproject
    - podSelector:
        matchLabels:
          role: somerole
    ports:
    - protocol: TCP
      port: 6379
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'deny-other-namespaces'],
    `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-other-namespaces
  namespace: target-ns
spec:
  podSelector:
  ingress:
  - from:
    - podSelector: {}
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'db-or-api-allow-app'],
    `
apiVersion: networking.k8s.io/v1
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
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'api-allow-http-and-https'],
    `
apiVersion: networking.k8s.io/v1
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
      ports:
        - protocol: TCP
          port: 80
        - protocol: TCP
          port: 443
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'default-deny-all'],
    `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: target-ns
spec:
  podSelector:
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'web-allow-external'],
    `
apiVersion: networking.k8s.io/v1
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
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'web-db-allow-all-ns'],
    `
apiVersion: networking.k8s.io/v1
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
`,
  )
  .setIn(
    [referenceForModel(k8sModels.NetworkPolicyModel), 'web-allow-production'],
    `
apiVersion: networking.k8s.io/v1
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
`,
  )
  .setIn(
    [referenceForModel(k8sModels.BuildConfigModel), 'default'],
    `
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: example
spec:
  source:
    git:
      ref: master
      uri: https://github.com/openshift/ruby-ex.git
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:2.7
        namespace: openshift
      env: []
  triggers:
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
`,
  )
  .setIn(
    [referenceForModel(k8sModels.DeploymentModel), 'default'],
    `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: httpd
  replicas: 3
  template:
    metadata:
      labels:
        app: httpd
    spec:
      containers:
      - name: httpd
        image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
        ports:
        - containerPort: 8080
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConfigMapModel), 'default'],
    `
apiVersion: v1
kind: ConfigMap
metadata:
  name: example
  namespace: default
data:
  example.property.1: hello
  example.property.2: world
  example.property.file: |-
    property.1=value-1
    property.2=value-2
    property.3=value-3
`,
  )
  .setIn(
    [referenceForModel(k8sModels.CronJobModel), 'default'],
    `
apiVersion: batch/v1
kind: CronJob
metadata:
  name: example
spec:
  schedule: "@daily"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
`,
  )
  .setIn(
    [referenceForModel(k8sModels.CustomResourceDefinitionModel), 'default'],
    `
    apiVersion: apiextensions.k8s.io/v1
    kind: CustomResourceDefinition
    metadata:
      # name must match the spec fields below, and be in the form: <plural>.<group>
      name: crontabs.stable.example.com
    spec:
      # group name to use for REST API: /apis/<group>/<version>
      group: stable.example.com
      # list of versions supported by this CustomResourceDefinition
      versions:
        - name: v1
          # Each version can be enabled/disabled by Served flag.
          served: true
          # One and only one version must be marked as the storage version.
          storage: true
          schema:
            openAPIV3Schema:
              type: object
              properties:
                spec:
                  type: object
                  properties:
                    cronSpec:
                      type: string
                    image:
                      type: string
                    replicas:
                      type: integer
      # either Namespaced or Cluster
      scope: Namespaced
      names:
        # plural name to be used in the URL: /apis/<group>/<version>/<plural>
        plural: crontabs
        # singular name to be used as an alias on the CLI and for display
        singular: crontab
        # kind is normally the CamelCased singular type. Your resource manifests use this.
        kind: CronTab
        # shortNames allow shorter string to match your resource on the CLI
        shortNames:
        - ct
`,
  )
  .setIn(
    [referenceForModel(k8sModels.DeploymentConfigModel), 'default'],
    `
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: example
spec:
  selector:
    app: httpd
  replicas: 3
  template:
    metadata:
      labels:
        app: httpd
    spec:
      containers:
      - name: httpd
        image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
        ports:
        - containerPort: 8080
`,
  )
  .setIn(
    [referenceForModel(k8sModels.PersistentVolumeModel), 'default'],
    `
apiVersion: v1
kind: PersistentVolume
metadata:
  name: example
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: slow
  nfs:
    path: /tmp
    server: 172.17.0.2
`,
  )
  .setIn(
    [referenceForModel(k8sModels.HorizontalPodAutoscalerModel), 'default'],
    `
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: example
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 50
        type: Utilization
`,
  )
  .setIn(
    [referenceForModel(k8sModels.PodModel), 'default'],
    `
apiVersion: v1
kind: Pod
metadata:
  name: example
  labels:
    app: httpd
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: httpd
      image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
      ports:
        - containerPort: 8080
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
          - ALL
`,
  )
  .setIn(
    [referenceForModel(k8sModels.IngressModel), 'default'],
    `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /testpath
        pathType: Prefix
        backend:
          service:
            name: test
            port:
              number: 80
`,
  )
  .setIn(
    [referenceForModel(k8sModels.JobModel), 'default'],
    `
apiVersion: batch/v1
kind: Job
metadata:
  name: example
spec:
  selector: {}
  template:
    metadata:
      name: pi
    spec:
      containers:
      - name: pi
        image: perl
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ImageStreamModel), 'default'],
    `
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: example
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleBindingModel), 'default'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: example
subjects:
- kind: Group
  name: "my-sample-group"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleModel), 'default'],
    `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: example
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleModel), 'read-pods-within-ns'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods-within-ns
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleModel), 'read-write-deployment-in-ext-and-apps-apis'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-write-deployment-in-ext-and-apps-apis
  namespace: default
rules:
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleModel), 'read-pods-and-read-write-jobs'],
    `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods-and-read-write-jobs
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch", "extensions"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RoleModel), 'read-configmap-within-ns'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-configmap-within-ns
  namespace: default
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["my-config"]
  verbs: ["get"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ClusterRoleModel), 'read-nodes'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: read-nodes
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ClusterRoleModel), 'get-and-post-to-non-resource-endpoints'],
    `
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: get-and-post-to-non-resource-endpoints
rules:
- nonResourceURLs: ["/healthz", "/healthz/*"] # '*' in a nonResourceURL is a suffix glob match
  verbs: ["get", "post"]
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ServiceModel), 'default'],
    `
apiVersion: v1
kind: Service
metadata:
  name: example
spec:
  selector:
    app: MyApp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9376
`,
  )
  .setIn(
    [referenceForModel(k8sModels.DaemonSetModel), 'default'],
    `
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: httpd
  template:
    metadata:
      labels:
        app: httpd
    spec:
      containers:
      - name: httpd
        image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
        ports:
        - containerPort: 8080
`,
  )
  .setIn(
    [referenceForModel(k8sModels.PersistentVolumeClaimModel), 'default'],
    `
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: example
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ResourceQuotaModel), 'default'],
    `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: example
spec:
  hard:
    pods: "4"
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
`,
  )
  .setIn(
    [referenceForModel(k8sModels.LimitRangeModel), 'default'],
    `
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
spec:
  limits:
  - default:
      memory: 512Mi
    defaultRequest:
      memory: 256Mi
    type: Container
`,
  )
  .setIn(
    [referenceForModel(k8sModels.StatefulSetModel), 'default'],
    `
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: example
spec:
  serviceName: "nginx"
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      terminationGracePeriodSeconds: 10
      containers:
      - name: nginx
        image: gcr.io/google_containers/nginx-slim:0.8
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: my-storage-class
      resources:
        requests:
          storage: 1Gi
`,
  )
  .setIn(
    [referenceForModel(k8sModels.StorageClassModel), 'default'],
    `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: example
provisioner: my-provisioner
reclaimPolicy: Delete
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ServiceAccountModel), 'default'],
    `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: example
`,
  )
  .setIn(
    [referenceForModel(k8sModels.SecretModel), 'default'],
    `
apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
stringData:
  username: admin
  password: opensesame
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ReplicaSetModel), 'default'],
    `
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: example
spec:
  replicas: 2
  selector:
    matchLabels:
      app: httpd
  template:
    metadata:
      name: httpd
      labels:
        app: httpd
    spec:
      containers:
      - name: httpd
        image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
        ports:
        - containerPort: 8080
`,
  )
  .setIn(
    [referenceForModel(k8sModels.RouteModel), 'default'],
    `
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: example
spec:
  path: /
  to:
    kind: Service
    name: example
  port:
    targetPort: 80
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ReplicationControllerModel), 'default'],
    `
apiVersion: v1
kind: ReplicationController
metadata:
  name: example
spec:
  replicas: 2
  selector:
    app: httpd
  template:
    metadata:
      name: httpd
      labels:
        app: httpd
    spec:
      containers:
      - name: httpd
        image: image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
        ports:
        - containerPort: 8080
`,
  )
  .setIn(
    [referenceForModel(k8sModels.BuildConfigModel), 'docker-build'],
    `
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: docker-build
  namespace: default
  labels:
    name: docker-build
spec:
  triggers:
  - type: GitHub
    github:
      secret: secret101
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
  source:
    type: Git
    git:
      uri: https://github.com/openshift/ruby-hello-world.git
  strategy:
    type: Docker
    dockerStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:latest
        namespace: openshift
      env:
      - name: EXAMPLE
        value: sample-app
  output:
    to:
      kind: ImageStreamTag
      name: origin-ruby-sample:latest
  postCommit:
    args:
    - bundle
    - exec
    - rake
    - test
`,
  )
  .setIn(
    [referenceForModel(k8sModels.BuildConfigModel), 's2i-build'],
    `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: s2i-build
  namespace: default
spec:
  output:
    to:
      kind: ImageStreamTag
      name: s2i-build:latest
  source:
    git:
      ref: master
      uri: https://github.com/openshift/ruby-ex.git
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:2.4
        namespace: openshift
      env: []
  triggers:
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
`,
  )
  .setIn(
    [referenceForModel(k8sModels.GroupModel), 'default'],
    `
apiVersion: user.openshift.io/v1
kind: Group
metadata:
  name: example
users:
- user1
- user2
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ResourceQuotaModel), 'rq-compute'],
    `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace:
spec:
  hard:
    requests.cpu: '1'
    requests.memory: 1Gi
    limits.cpu: '2'
    limits.memory: 2Gi
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ResourceQuotaModel), 'rq-storageclass'],
    `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-class-quota
  namespace:
spec:
  hard:
    requests.storage: 100Gi
    persistentvolumeclaims: '100'
    # For quota specific to a storage class, the storage class must have the same name
    gold.storage-class.kubernetes.io/requests.storage: 3Gi
    gold.storage-class.kubernetes.io/persistentvolumeclaims: '5'
    silver.storage-class.kubernetes.io/requests.storage: 2Gi
    silver.storage-class.kubernetes.io/persistentvolumeclaims: '3'
    bronze.storage-class.kubernetes.io/requests.storage: 1Gi
    bronze.storage-class.kubernetes.io/persistentvolumeclaims: '1'
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ResourceQuotaModel), 'rq-counts'],
    `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-counts
  namespace:
spec:
  hard:
    configmaps: "10"
    persistentvolumeclaims: "4"
    replicationcontrollers: "20"
    secrets: "10"
    services: "10"
    services.loadbalancers: "2"
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ClusterAutoscalerModel), 'default'],
    `
apiVersion: "autoscaling.openshift.io/v1"
kind: "ClusterAutoscaler"
metadata:
  name: "default"
spec: {}
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineDeploymentModel), 'default'],
    `
apiVersion: "machine.openshift.io/v1beta1"
kind: MachineDeployment
metadata:
  name: example
spec:
  replicas: 3
  selector:
    matchLabels:
      foo: bar
  template:
    metadata:
      labels:
        foo: bar
    spec:
      providerSpec: {}
      versions:
        kubelet: ""
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineSetModel), 'default'],
    `
apiVersion: "machine.openshift.io/v1beta1"
kind: MachineSet
metadata:
  name: example
spec:
  replicas: 3
  selector:
    matchLabels:
      foo: bar
  template:
    metadata:
      labels:
        foo: bar
    spec:
      providerSpec: {}
      versions:
        kubelet: ""
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineModel), 'default'],
    `
apiVersion: "machine.openshift.io/v1beta1"
kind: Machine
metadata:
  name: example
spec:
  providerSpec: {}
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineConfigPoolModel), 'default'],
    `
apiVersion: machineconfiguration.openshift.io/v1
kind: MachineConfigPool
metadata:
  name: example
spec:
  machineConfigSelector:
    matchLabels:
      machineconfiguration.openshift.io/role: master
  nodeSelector:
    matchLabels:
      node-role.kubernetes.io/master: ""
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineAutoscalerModel), 'default'],
    `
apiVersion: "autoscaling.openshift.io/v1beta1"
kind: "MachineAutoscaler"
metadata:
  name: "worker-us-east-1a"
  namespace: "openshift-machine-api"
spec:
  minReplicas: 1
  maxReplicas: 12
  scaleTargetRef:
    apiVersion: machine.openshift.io/v1beta1
    kind: MachineSet
    name: worker
`,
  )
  .setIn(
    [referenceForModel(k8sModels.MachineHealthCheckModel), 'default'],
    `
apiVersion: machine.openshift.io/v1beta1
kind: MachineHealthCheck
metadata:
  name: example
  namespace: openshift-machine-api
spec:
  selector:
    matchLabels:
      machine.openshift.io/cluster-api-cluster: my-cluster
      machine.openshift.io/cluster-api-machine-role: worker
      machine.openshift.io/cluster-api-machine-type: worker
      machine.openshift.io/cluster-api-machineset: my-machine-set
  unhealthyConditions:
  - type:    "Ready"
    status:  "Unknown"
    timeout: "300s"
  - type:    "Ready"
    status:  "False"
    timeout: "300s"
  maxUnhealthy: "40%"
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleLinkModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleLink
metadata:
  name: example
spec:
  href: 'https://www.example.com'
  location: HelpMenu
  text: Help Menu Link
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleLinkModel), 'cl-user-menu'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleLink
metadata:
  name: example-user-menu
spec:
  href: 'https://www.example.com'
  location: UserMenu
  text: User Menu Link
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleLinkModel), 'cl-application-menu'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleLink
metadata:
  name: example-application-menu
spec:
  href: 'https://www.example.com'
  location: ApplicationMenu
  text: Application Menu Link
  applicationMenu:
    section: Example Section
    imageURL: data:image/svg+xml;base64,PHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyNCAyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTE4LjkgMi4xdjIuMWgtMS43di0yLjFjMC0uMSAwLS4yLS4xLS4zcy0uMi0uMS0uMy0uMWgtMTQuN2MtLjEgMC0uMiAwLS4zLjEgMCAuMS0uMS4yLS4xLjN2MTQuNmMwIC4xIDAgLjIuMS4zcy4yLjEuMy4xaDIuMXYxLjdoLTIuMWMtLjYgMC0xLjEtLjItMS41LS42LS40LS40LS42LS45LS42LTEuNXYtMTQuNmMwLS41LjItMS4xLjYtMS41czEtLjYgMS41LS42aDE0LjZjLjYgMCAxLjEuMiAxLjUuNnMuNyAxIC43IDEuNXptNS4xIDUuMnYxNC42YzAgLjYtLjIgMS4xLS42IDEuNXMtMSAuNi0xLjUuNmgtMTQuNmMtLjYgMC0xLjEtLjItMS41LS42cy0uNi0uOS0uNi0xLjV2LTE0LjZjMC0uNi4yLTEuMS42LTEuNXMuOS0uNiAxLjUtLjZoMTQuNmMuNiAwIDEuMS4yIDEuNS42cy42LjkuNiAxLjV6bS0xLjcgMTQuNnYtMTQuNmMwLS4xIDAtLjItLjEtLjNzLS4yLS4xLS4zLS4xaC0xNC42Yy0uMSAwLS4yIDAtLjMuMXMtLjEuMi0uMS4zdjE0LjZjMCAuMSAwIC4yLjEuM3MuMi4xLjMuMWgxNC42Yy4xIDAgLjIgMCAuMy0uMXMuMS0uMi4xLS4zeiIvPjwvc3ZnPg==
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleLinkModel), 'cl-namespace-dashboard'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleLink
metadata:
  name: example-namespace-dashboard
spec:
  href: 'https://www.example.com'
  location: NamespaceDashboard
  text: Namespace Dashboard Link
  namespaceDashboard:
    namespaces:
      - default
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleCLIDownloadModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleCLIDownload
metadata:
  name: example
spec:
  displayName: examplecli
  description: |
    This is an example CLI download description that can include markdown such as paragraphs, unordered lists, code, [links](https://www.example.com), etc.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce a lobortis justo, eu suscipit purus.
  links:
    - href: 'https://www.example.com'
      text: Download Example CLI
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleNotificationModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleNotification
metadata:
  name: example
spec:
  text: This is an example notification message with an optional link.
  location: BannerTop
  link:
    href: 'https://www.example.com'
    text: Optional link text
  color: '#fff'
  backgroundColor: '#0088ce'
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleExternalLogLinkModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleLogLink
metadata:
  name: example
spec:
  hrefTemplate: 'https://example.com/logs?resourceName=\${resourceName}&containerName=\${containerName}&resourceNamespace=\${resourceNamespace}&podLabels=\${podLabels}'
  text: Example Logs
`,
  )
  .setIn(
    [referenceForModel(appModels.QuickStartModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleQuickStart
metadata:
  name: example
spec:
  displayName: Deploy image
  tags:
  - example
  - image
  - deployment
  durationMinutes: 5
  description: Deploy an example application from an image.
  introduction: |-
    ### In this example quick start, you'll deploy an existing image to OpenShift. For more information on writing quick starts, see our [quick start guidelines.](http://openshift.github.io/openshift-origin-design/conventions/documentation/quick-starts.html)
  tasks:
    - title: Deploy an existing image from an image registry
      description: |-
        ### To deploy the **httpd-24-centos7** image, follow these steps:
        1. Enter the developer perspective: In the main navigation menu, click the [dropdown menu]{{highlight tour-perspective-dropdown}} and select **Developer**.
        2. In the main navigation menu, click **Add.**
        3. Using the project dropdown menu, select the project you would like to deploy the image in.
        4. Click the **Container Image** tile.
        5. In the **Image name from external registry** field, enter **quay.io/centos7/httpd-24-centos7**.
        6. Fill in the remaining image deployment details, and then click **Create.**
        The **Topology** view will load with your **httpd-24-centos7-app** application. The outer rim of the larger circle represents your application, and the small circle represents the deployment.
      review:
        instructions: |-
          #### Verify the image was successfully deployed:
          Do you see a **httpd-24-centos7** deployment?
        failedTaskHelp: This task isn’t verified yet. Try the task again.
      summary:
        success: Great work! You deployed an example application using the **quay.io/centos7/httpd-24-centos7** image.
        failed: Try the steps again.
    - title: Run the deployed application
      description: |-
        ### To run the **httpd-24-centos7** deployment application, follow these steps:
        1. In the **Topology** view, click the **httpd-24-centos7** deployment circle.
        2. In the panel that slides out, click the link in the **Routes** section. This opens the URL and runs the application.
      review:
        instructions: |-
          #### Verify your application is running:
          In the new tab, do you see the Apache HTTP server test page?
        failedTaskHelp: This task isn’t verified yet. Try the task again.
      summary:
        success: Great work! You deployed the **quay.io/centos7/httpd-24-centos7** image.
        failed: Try the steps again.
  conclusion: Your example **httpd-24-centos7-app** application, using the **quay.io/centos7/httpd-24-centos7** image, is deployed and ready.
`,
  )
  .setIn(
    [referenceForModel(k8sModels.ConsoleYAMLSampleModel), 'default'],
    `
apiVersion: console.openshift.io/v1
kind: ConsoleYAMLSample
metadata:
  name: example
spec:
  targetResource:
    apiVersion: batch/v1
    kind: Job
  title: 'Example Job'
  description: 'An example Job YAML sample'
  yaml: |
    apiVersion: batch/v1
    kind: Job
    metadata:
      name: countdown
    spec:
      template:
        metadata:
          name: countdown
        spec:
          containers:
          - name: counter
            image: centos:7
            command:
            - "bin/bash"
            - "-c"
            - "for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done"
          restartPolicy: Never
`,
  )
  .setIn(
    [referenceForModel(k8sModels.VolumeSnapshotModel), 'default'],
    `
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: example-snap
spec:
  volumeSnapshotClassName: example-snapclass
  source:
    persistentVolumeClaimName: pvc-test
`,
  )
  .setIn(
    [referenceForModel(k8sModels.VolumeSnapshotClassModel), 'default'],
    `
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: example-snapclass
driver: hostpath.csi.k8s.io #csi-hostpath
deletionPolicy: Delete
`,
  )
  .setIn(
    [referenceForModel(k8sModels.VolumeSnapshotContentModel), 'default'],
    `
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotContent
metadata:
  name: example-snapcontent
spec:
  deletionPolicy: Delete
  driver: hostpath.csi.k8s.io
  source:
    snapshotHandle: 7bdd0de3-aaeb-11e8-9aae-0242ac110002
  volumeSnapshotClassName: example-snapclass
  volumeSnapshotRef:
    name: example-snap
    namespace: default
`,
  )
  .setIn(
    [referenceForModel(PodDisruptionBudgetModel), 'default'],
    `
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ''
spec:
  selector:
    {}
`,
  )
  .setIn(
    [referenceForModel(PodDisruptionBudgetModel), 'pdb-max-unavailable'],
    `
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: example
  namespace: target-ns
spec:
 maxUnavailable: 0
 selector:
    matchLabels:
      app: hello-openShift
`,
  )
  .setIn(
    [referenceForModel(PodDisruptionBudgetModel), 'pdb-min-available'],
    `
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: example
  namespace: target-ns
spec:
 minAvailable: "25%"
 selector:
    matchLabels:
      app: hello-openShift
`,
  );

export const getYAMLTemplates = (extensionTemplates: ResolvedExtension<YAMLTemplate>[] = []) =>
  ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
    .merge(baseTemplates)
    .withMutations((map) => {
      extensionTemplates.forEach((yt) => {
        const modelRef = referenceForExtensionModel(yt.properties.model);
        const templateName = yt.properties.name || 'default';

        if (!baseTemplates.hasIn([modelRef, templateName])) {
          map.setIn([modelRef, templateName], yt.properties.template);
        }
      });
    });
