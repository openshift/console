FROM alpine:3.4
COPY grafana-dashboards /etc/tectonic/grafana-dashboards
COPY manifests/manager-deployed /etc/tectonic/manifests
COPY bin/tectonic-manager /tectonic-manager
CMD /tectonic-manager
