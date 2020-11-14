# docker build should be run from repo root directory
FROM centos:7

ENV REPODIR=/go/src/github.com/openshift/console/

RUN mkdir -p ${REPODIR}
RUN chmod 777 ${REPODIR}
ADD . ${REPODIR}
WORKDIR ${REPODIR}

RUN yum install expect wget -y && yum clean all && rm -rf /var/cache/yum /var/cache/dnf

RUN KUBEVIRT_VERSION=$(curl -s https://github.com/kubevirt/kubevirt/releases/latest | grep -o "v[0-9]\.[0-9]*\.[0-9]*"); \
    VIRTCTL_DOWNLOAD_URL="https://github.com/kubevirt/kubevirt/releases/download/${KUBEVIRT_VERSION}/virtctl-${KUBEVIRT_VERSION}"; \
    VIRTCTL_X86_64="${VIRTCTL_DOWNLOAD_URL}-linux-x86_64"; \
    VIRTCTL_AMD64="${VIRTCTL_DOWNLOAD_URL}-linux-amd64"; \
    wget ${VIRTCTL_AMD64} -O /usr/bin/virtctl || wget ${VIRTCTL_X86_64} -O /usr/bin/virtctl
RUN chmod +x /usr/bin/virtctl
