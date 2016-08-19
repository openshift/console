# Builds a production container for distributing the Wiz portion of tectonic-installer.

FROM alpine:3.4
# Do this first for caching
RUN apk update
RUN apk add ca-certificates

ADD bin/linux /opt/wiz/bin
ADD manifest /opt/wiz/manifest
ADD web /opt/wiz/web
ADD .workspace/common/img /opt/wiz/web/img
ADD .workspace/common/lib /opt/wiz/web/lib
ADD .workspace/common/css /opt/wiz/web/css

WORKDIR /opt/wiz
CMD ["./bin/wiz", "start", "--manifest-file=tectonic.json"]
