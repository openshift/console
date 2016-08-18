#!/bin/sh

# This script sets up port forwarding from a kubernetes cluster
# running Tectonic Console on your local machine. While it's running,
# you can see your Console at http://localhost:9000

# For convenience, you can also just add this command as an alias in
# your shell, by adding a line like the following to your profile or
# login script.
#
#   alias tectonic-connect='kubectl get pods -l tectonic-app=console -o template --template="{{range.items}}{{.metadata.name}}{{end}}" | xargs -i{} kubectl port-forward {} 9000'
#

kubectl get pods -l app=tectonic-console -o template --template="{{range.items}}{{.metadata.name}}{{end}}" --namespace=tectonic-system | xargs -I{} kubectl port-forward {} 9000 --namespace=tectonic-system
