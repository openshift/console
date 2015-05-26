FROM busybox
ADD frontend/public/dist /opt/bridge/static
ADD bin/bridge /opt/bridge/bin/bridge
CMD /opt/bridge/bin/bridge --public-dir=/opt/bridge/static --listen=http://0.0.0.0:9000 --k8s-api-version=v1beta3
