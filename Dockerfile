FROM openshift/origin-base

ADD frontend/public/dist /opt/bridge/static
ADD bin/bridge /opt/bridge/bin/bridge
ADD etc/ssl /etc/ssl

LABEL io.k8s.display-name="OpenShift Console" \
      io.k8s.description="This is a component of OpenShift Container Platform and provides a web console." \
      io.openshift.tags="openshift" \
      maintainer="Samuel Padgett <spadgett@redhat.com>"

# doesn't require a root user.
USER 1001

CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]
