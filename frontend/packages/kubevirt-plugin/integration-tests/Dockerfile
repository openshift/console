# "src" is build by a prow job
FROM src as source

FROM centos:7

RUN mkdir -p /go/src/github.com/openshift/console/
COPY --from=source /go/src/github.com/openshift/console /go/src/github.com/openshift/console
WORKDIR /go/src/github.com/openshift/console/


RUN yum install expect -y && yum clean all && rm -rf /var/cache/yum /var/cache/dnf
