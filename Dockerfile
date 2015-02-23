FROM busybox
ADD frontend/public/dist /opt/bridge/assets
ADD bin/bridge /opt/bridge/bin/bridge
CMD /opt/bridge/bin/bridge --public-dir=/opt/bridge/assets --listen=http://0.0.0.0:9000 --k8s-api-version=v1beta3 --k8s-url=http://${SERVICE_HOST}:8080 --etcd-endpoints=http://${SERVICE_HOST}:7001
