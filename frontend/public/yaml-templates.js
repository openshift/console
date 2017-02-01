export const TEMPLATES = {};

TEMPLATES['v1beta1.Job'] = `apiVersion: extensions/v1beta1
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
