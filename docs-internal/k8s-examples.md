# Example Kubernetes Manifests

This directory contains manifests commonly used to test Tectonic Console functionality.

To easily seed your cluster with example objects, run:

`kubectl create -f k8s-examples`

## Adding new manifests

If you find yourself using a particular manifest for development & testing, add it here!

Resources should be labeled with `app=k8s-examples`.
