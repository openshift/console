export const TEMPLATES = {};

TEMPLATES['v1beta1.Job'] = `apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
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
  name: example-app
  labels:
    app: example-app
    version: v1
    role: backend
spec:
  containers:
  - name: java
    image: companyname/java
    ports:
    - containerPort: 443
    volumeMounts:
    - mountPath: /volumes/logs
      name: logs
  - name: logger
    image: companyname/logger:v1.2.3
    ports:
    - containerPort: 9999
    volumeMounts:
    - mountPath: /logs
      name: logs
  - name: monitoring
    image: companyname/monitoring:v4.5.6
    ports:
    - containerPort: 1234`;
