import { Map as ImmutableMap } from 'immutable';

import { GroupVersionKind, referenceForModel } from '../module/k8s';
import * as k8sModels from '../models';
import * as plugins from '../plugins';

/**
 * Sample YAML manifests for some of the statically-defined Kubernetes models.
 */
export const baseTemplates = ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
  .setIn(['DEFAULT', 'default'], `
apiVersion: ''
kind: ''
metadata:
  name: example
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'deny-other-namespaces'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'db-or-api-allow-app'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'api-allow-http-and-https'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'default-deny-all'], `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: target-ns
spec:
  podSelector:
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'web-allow-external'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'web-db-allow-all-ns'], `
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
`).setIn([referenceForModel(k8sModels.NetworkPolicyModel), 'web-allow-production'], `
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
`).setIn([referenceForModel(k8sModels.BuildConfigModel), 'default'], `
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
        name: ruby:2.4
        namespace: openshift
      env: []
  triggers:
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
`).setIn([referenceForModel(k8sModels.ChargebackReportModel), 'default'], `
apiVersion: metering.openshift.io/v1alpha1
kind: Report
metadata:
  name: namespace-memory-request
  namespace: openshift-metering
spec:
  query: namespace-memory-request
  reportingStart: '2019-01-01T00:00:00Z'
  reportingEnd: '2019-12-30T23:59:59Z'
  runImmediately: true
`)
  .setIn([referenceForModel(k8sModels.DeploymentModel), 'default'], `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: hello-openshift
  replicas: 3
  template:
    metadata:
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.ConfigMapModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.CronJobModel), 'default'], `
apiVersion: batch/v1beta1
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
`).setIn([referenceForModel(k8sModels.CustomResourceDefinitionModel), 'default'], `
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  # name must match the spec fields below, and be in the form: <plural>.<group>
  name: crontabs.stable.example.com
spec:
  # group name to use for REST API: /apis/<group>/<version>
  group: stable.example.com
  # version name to use for REST API: /apis/<group>/<version>
  version: v1
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
`).setIn([referenceForModel(k8sModels.DeploymentConfigModel), 'default'], `
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: example
spec:
  selector:
    app: hello-openshift
  replicas: 3
  template:
    metadata:
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.PersistentVolumeModel), 'default'], `
apiVersion: v1
kind: PersistentVolume
metadata:
  name: example
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: slow
  nfs:
    path: /tmp
    server: 172.17.0.2
`).setIn([referenceForModel(k8sModels.HorizontalPodAutoscalerModel), 'default'], `
apiVersion: autoscaling/v2beta1
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
      targetAverageUtilization: 50
`).setIn([referenceForModel(k8sModels.PodModel), 'default'], `
apiVersion: v1
kind: Pod
metadata:
  name: example
  labels:
    app: hello-openshift
spec:
  containers:
    - name: hello-openshift
      image: openshift/hello-openshift
      ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.IngressModel), 'default'], `
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: example
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /testpath
        backend:
          serviceName: test
          servicePort: 80
`).setIn([referenceForModel(k8sModels.JobModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.ImageStreamModel), 'default'], `
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: example
`).setIn([referenceForModel(k8sModels.RoleBindingModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.RoleModel), 'default'], `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: example
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
`).setIn([referenceForModel(k8sModels.RoleModel), 'read-pods-within-ns'], `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods-within-ns
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
`).setIn([referenceForModel(k8sModels.RoleModel), 'read-write-deployment-in-ext-and-apps-apis'], `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-write-deployment-in-ext-and-apps-apis
  namespace: default
rules:
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
`)
  .setIn([referenceForModel(k8sModels.RoleModel), 'read-pods-and-read-write-jobs'], `apiVersion: rbac.authorization.k8s.io/v1
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
`)
  .setIn([referenceForModel(k8sModels.RoleModel), 'read-configmap-within-ns'], `
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
`).setIn([referenceForModel(k8sModels.ClusterRoleModel), 'read-nodes'], `
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: read-nodes
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
`).setIn([referenceForModel(k8sModels.ClusterRoleModel), 'get-and-post-to-non-resource-endpoints'], `
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: get-and-post-to-non-resource-endpoints
rules:
- nonResourceURLs: ["/healthz", "/healthz/*"] # '*' in a nonResourceURL is a suffix glob match
  verbs: ["get", "post"]
`).setIn([referenceForModel(k8sModels.ServiceModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.DaemonSetModel), 'default'], `
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: hello-openshift
  template:
    metadata:
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.PersistentVolumeClaimModel), 'default'], `
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: example
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
`).setIn([referenceForModel(k8sModels.ResourceQuotaModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.LimitRangeModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.StatefulSetModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.StorageClassModel), 'default'], `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: example
provisioner: my-provisioner
reclaimPolicy: Delete
`).setIn([referenceForModel(k8sModels.ServiceAccountModel), 'default'], `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: example
`).setIn([referenceForModel(k8sModels.SecretModel), 'default'], `
apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
stringData:
  username: admin
  password: opensesame
`).setIn([referenceForModel(k8sModels.ReplicaSetModel), 'default'], `
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: example
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-openshift
  template:
    metadata:
      name: hello-openshift
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.RouteModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.ReplicationControllerModel), 'default'], `
apiVersion: v1
kind: ReplicationController
metadata:
  name: example
spec:
  replicas: 2
  selector:
    app: hello-openshift
  template:
    metadata:
      name: hello-openshift
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080
`).setIn([referenceForModel(k8sModels.BuildConfigModel), 'docker-build'], `
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
`).setIn([referenceForModel(k8sModels.BuildConfigModel), 's2i-build'], `apiVersion: build.openshift.io/v1
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
`).setIn([referenceForModel(k8sModels.BuildConfigModel), 'pipeline-build'], `
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  labels:
    name: pipeline-build
  name: pipeline-build
  namespace: default
spec:
  strategy:
    jenkinsPipelineStrategy:
      jenkinsfile: |-
        node('nodejs') {
          stage('build') {
            sh 'npm --version'
          }
        }
    type: JenkinsPipeline
  triggers:
  - type: ConfigChange
`).setIn([referenceForModel(k8sModels.ClusterServiceBrokerModel), 'default'], `
apiVersion: servicecatalog.k8s.io/v1beta1
kind: ClusterServiceBroker
metadata:
  name: example-cluster-service-broker
spec:
  url: https://example.com/broker/
`).setIn([referenceForModel(k8sModels.ResourceQuotaModel), 'rq-compute'], `
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
`).setIn([referenceForModel(k8sModels.ResourceQuotaModel), 'rq-storageclass'], `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-class-quota
  namespace:
spec:
  hard:
    requests.storage: 100Gi
    persistentvolumeclaims: 100
    # For quota specific to a storage class, the storage class must have the same name
    gold.storage-class.kubernetes.io/requests.storage: 3Gi
    gold.storage-class.kubernetes.io/persistentvolumeclaims: 5
    silver.storage-class.kubernetes.io/requests.storage: 2Gi
    silver.storage-class.kubernetes.io/persistentvolumeclaims: 3
    bronze.storage-class.kubernetes.io/requests.storage: 1Gi
    bronze.storage-class.kubernetes.io/persistentvolumeclaims: 1
`).setIn([referenceForModel(k8sModels.ResourceQuotaModel), 'rq-counts'], `
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
`).setIn([referenceForModel(k8sModels.ClusterAutoscalerModel), 'default'], `
apiVersion: "autoscaling.openshift.io/v1"
kind: "ClusterAutoscaler"
metadata:
  name: "default"
spec: {}
`).setIn([referenceForModel(k8sModels.MachineDeploymentModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.MachineSetModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.MachineModel), 'default'], `
apiVersion: "machine.openshift.io/v1beta1"
kind: Machine
metadata:
  name: example
spec:
  providerSpec: {}
`).setIn([referenceForModel(k8sModels.MachineConfigPoolModel), 'default'], `
apiVersion: machineconfiguration.openshift.io/v1
kind: MachineConfigPool
metadata:
  name: example
spec:
  machineConfigSelector:
    matchLabels:
      machineconfiguration.openshift.io/role: master
  machineSelector:
    matchLabels:
      node-role.kubernetes.io/master: ""
`).setIn([referenceForModel(k8sModels.MachineAutoscalerModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.ConsoleLinkModel), 'default'], `
apiVersion: console.openshift.io/v1
kind: ConsoleLink
metadata:
  name: example
spec:
  href: 'https://www.example.com'
  location: HelpMenu
  text: Additional help menu link
`).setIn([referenceForModel(k8sModels.ConsoleCLIDownloadModel), 'default'], `
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
`).setIn([referenceForModel(k8sModels.ConsoleNotificationModel), 'default'], `
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
`);

const pluginTemplates = ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
  .withMutations(map => {
    plugins.registry.getYAMLTemplates().forEach(yt => {
      const modelRef = referenceForModel(yt.properties.model);
      const templateName = yt.properties.templateName || 'default';

      if (!baseTemplates.hasIn([modelRef, templateName])) {
        map.setIn([modelRef, templateName], yt.properties.template);
      }
    });
  });

export const yamlTemplates = baseTemplates.merge(pluginTemplates);
