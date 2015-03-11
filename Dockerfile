FROM busybox
ADD frontend/public/dist /opt/bridge/static
ADD bin/bridge /opt/bridge/bin/bridge
CMD /opt/bridge/bin/bridge --public-dir=/opt/bridge/static --listen=http://0.0.0.0:9000 --etcd-endpoints=http://${SERVICE_HOST}:7001 --k8s-api-version=v1beta3 --k8s-endpoint=http://${SERVICE_HOST}:8080 --k8s-api-service=${K8S_API_SERVICE} --k8s-controller-manager-service=${K8S_CONTROLLER_MANAGER_SERVICE} --k8s-scheduler-service=${K8S_SCHEDULER_SERVICE}
