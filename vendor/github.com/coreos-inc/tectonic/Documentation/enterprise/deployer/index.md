# Getting Started with Tectonic

At its core, Tectonic is built on top of 100% open-source Kubernetes. This means no lock-in for Tectonic customers and everyone benefits from timely releases of new features, bug fixes and security updates.

## Install a New Cluster

### Deploy Kubernetes and Tectonic to a supported platform

Tectonic offers support, services and additional features that rely on a properly functioning Kubernetes cluster. The Kubernetes project offers [conformance tests][conformance-script], and Tectonic is supported on any cluster that passes these tests and runs on CoreOS Linux.

To get started as quickly as possible, use an install guide below to setup both Kubernetes and [Tectonic Services](tectonic_services.md).
If you'd like to tinker and build one from scratch, follow the manual installation instructions.

[conformance-script]: https://github.com/kubernetes/kubernetes/blob/master/hack/conformance-test.sh

#### Platform Guides

* [AWS Install Guide](platform-aws.md) - Install a scalable cluster using CloudFormation
* [Bare Metal Install Guide](platform-baremetal.html) - Deploy Kubernetes onto your physical infrastructure
* [Vagrant Installer (Single Machine)](https://coreos.com/kubernetes/docs/latest/kubernetes-on-vagrant-single.html) - This is meant for a quick Kubernetes environment for testing and development.
* [Vagrant Installer (Multi Machine)](https://coreos.com/kubernetes/docs/latest/kubernetes-on-vagrant.html) - Test out your applications on a multi-machine Kubernetes cluster.

#### Manual Install

Anywhere you can [run CoreOS Linux](https://coreos.com/os/docs/latest/#running-coreos), you can run Kubernetes. The following instructions provide an overview of how a supported Kubernetes deployment should be installed. It is intended to be a generic guide that allows you to integrate with your existing configuration management and deployment tools.

* [Kubernetes on CoreOS Linux Guide](https://coreos.com/kubernetes/docs/latest/getting-started.html)
