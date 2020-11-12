FROM centos:7

RUN mkdir -p /go/src/github.com/openshift/console/

# should be run from repo root directory
ADD . /go/src/github.com/openshift/console
WORKDIR /go/src/github.com/openshift/console/

RUN yum install expect -y && yum clean all && rm -rf /var/cache/yum /var/cache/dnf
