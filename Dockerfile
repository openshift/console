FROM busybox
ADD frontend/public/dist /opt/bridge/static
ADD bin/bridge /opt/bridge/bin/bridge
CMD /opt/bridge/bin/bridge --public-dir=/opt/bridge/static --k8s-api-version=v1beta3
