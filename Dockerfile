FROM alpine:3.7
ADD frontend/public/dist /opt/bridge/static
ADD bin/bridge /opt/bridge/bin/bridge
ADD etc/ssl /etc/ssl
CMD /opt/bridge/bin/bridge --public-dir=/opt/bridge/static
