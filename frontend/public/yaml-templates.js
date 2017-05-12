export const TEMPLATES = {};

TEMPLATES['batch/v1.Job'] = `apiVersion: extensions/v1beta1
kind: Job
metadata:
  name: pi
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
      restartPolicy: Never`;

TEMPLATES['v1.Pod'] = `apiVersion: v1
kind: Pod
metadata:
  name: redis
  labels:
    app: redis
spec:
  containers:
    - name: key-value-store
      image: redis
      ports:
        - containerPort: 6379`;

TEMPLATES['v1.Service'] = `apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9376`;

TEMPLATES['v1.ReplicationController'] = `apiVersion: v1
kind: ReplicationController
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    app: nginx
  template:
    metadata:
      name: nginx
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`;

TEMPLATES['v1beta1.ReplicaSet'] = `apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      name: nginx
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`;

TEMPLATES['v1beta1.Deployment'] = `apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`;


TEMPLATES['v1beta1.DaemonSet'] = `apiVersion: extensions/v1beta1
kind: Daemonset
metadata:
  name: nginx-daemonset
spec:
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`;

TEMPLATES['v1beta1.EtcdCluster'] = `apiVersion: etcd.coreos.com/v1beta1
kind: Cluster
metadata:
  name: example-etcd-cluster-with-backup
spec:
  size: 3
  version: 3.1.4
  backup:
    backupIntervalInSecond: 30
    maxBackups: 5
    storageType: PersistentVolume
    pv:
      volumeSizeInMB: 512`;

TEMPLATES['v1beta1.Role'] = `apiVersion: rbac.authorization.k8s.io/v1beta1
kind: Role
metadata:
  name: sample-pod-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]`;

TEMPLATES['v1beta1.RoleBinding'] = `apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: my-role-binding
subjects:
- kind: Group
  name: "my-sample-group"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io`;
