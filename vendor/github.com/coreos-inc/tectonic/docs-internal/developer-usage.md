
# Developer Usage

This guide covers network booting, provisioning, setting up a self-hosted Kubernetes cluster, and deploying Tectonic components end-to-end, on a single Linux development machine.

The following components will be used:

* [coreos-baremetal](https://github.com/coreos/coreos-baremetal) - network boot and provision machines (VMs in this case) with the `bootcfg` service
* [tectonic-bootstrap](https://github.com/coreos-inc/tectonic/tree/master/bootstrap) - `bootstrap` graphical app for populating `bootcfg` and creating a Kubernetes cluster
* [bootkube](https://github.com/coreos/bootkube) - self-hosted Kubernetes bootstrapping tool
* [tectonic-wiz](https://github.com/coreos-inc/tectonic/tree/master/wiz) - `wiz` graphical app for populating Kubernetes with Tectonic-specific manifests
* [tectonic-manager](https://github.com/coreos-inc/tectonic-manager) - Populates Kubernetes with Tectonic-specific manifests

Refer to the documentation in the individual projects for details if needed.

## Requirements

#### rkt

Install [rkt](https://github.com/coreos/rkt/releases) 1.8 or higher ([example script](https://github.com/dghubble/phoenix/blob/master/scripts/fedora/sources.sh)) and setup rkt [privilege separation](https://coreos.com/rkt/docs/latest/trying-out-rkt.html).

**Note**: rkt does not yet integrate with SELinux on Fedora. As a workaround, temporarily set enforcement to permissive if you are comfortable (`sudo setenforce Permissive`). Check the rkt [distribution notes](https://coreos.com/rkt/docs/latest/distributions.html) or see the tracking [issue](https://github.com/coreos/rkt/issues/1727).

#### libvirt/qemu

In lieu of physical machines, this guide will have you create VMs on your laptop, which adds a few additional dependencies (alternately, setup your datacenter and refer to the docs).

Install the package dependencies.

    # Fedora
    sudo dnf install virt-install virt-manager

    # Debian/Ubuntu
    sudo apt-get install virt-manager virtinst qemu-kvm systemd-container

#### metal0

Define the `metal0` virtual bridge with [CNI](https://github.com/appc/cni).

```bash
sudo mkdir -p /etc/rkt/net.d
sudo bash -c 'cat > /etc/rkt/net.d/20-metal.conf << EOF
{
  "name": "metal0",
  "type": "bridge",
  "bridge": "metal0",
  "isGateway": true,
  "ipMasq": true,
  "ipam": {
    "type": "host-local",
    "subnet": "172.15.0.0/16",
    "routes" : [ { "dst" : "0.0.0.0/0" } ]
   }
}
EOF'
```

On Fedora, add the `metal0` interface to the trusted zone in your firewall configuration.

    sudo firewall-cmd --add-interface=metal0 --zone=trusted

## coreos-baremetal

Clone the [coreos-baremetal](https://github.com/coreos/coreos-baremetal) source which contains the examples and scripts.

    git clone https://github.com/coreos/coreos-baremetal.git
    cd coreos-baremetal

Download CoreOS image assets in `exampels/assets`, which will be referenced by machine profiles later.

    ./scripts/get-coreos beta 1081.5.0

Create a CA, a server certificate and key, and a client certificate and key. You can generate **fake** credentials for these examples.

    cd examples/etc/bootcfg/
    ./cert-gen

### bootcfg

Run a local `bootcfg` service without any machine profiles, on the `metal0` bridge.

    cd /path/to/coreos-baremetal
    DATA=$(mktemp -d)
    sudo rkt run --net=metal0:IP=172.15.0.2 --mount volume=data,target=/var/lib/bootcfg --volume data,kind=host,source=$DATA --mount volume=assets,target=/var/lib/bootcfg/assets --volume assets,kind=host,source=$PWD/examples/assets,readOnly=true --mount volume=config,target=/etc/bootcfg --volume config,kind=host,source=$PWD/examples/etc/bootcfg,readOnly=true quay.io/coreos/bootcfg:latest -- -address=0.0.0.0:8080 -rpc-address=0.0.0.0:8081 -log-level=debug

Verify that the service is running by visiting [http://172.15.0.2:8080](http://172.15.0.2:8080), where you should see "bootcfg". For a real deployment, you would consult [deployment](https://github.com/coreos/coreos-baremetal/blob/master/Documentation/deployment.md).

### Network

Since the virtual network has no network boot services, use the `dnsmasq` ACI to create an iPXE network boot environment which runs DHCP, DNS, and TFTP.

Trust the [CoreOS App Signing Key](https://coreos.com/security/app-signing-key/).

    sudo rkt trust --prefix coreos.com/dnsmasq
    # gpg key fingerprint is: 18AD 5014 C99E F7E3 BA5F  6CE9 50BD D3E0 FC8A 365E

Run the `coreos.com/dnsmasq` ACI with rkt.

    sudo rkt run coreos.com/dnsmasq:v0.3.0 --net=metal0:IP=172.15.0.3 -- -d -q --dhcp-range=172.15.0.50,172.15.0.99 --enable-tftp --tftp-root=/var/lib/tftpboot --dhcp-userclass=set:ipxe,iPXE --dhcp-boot=tag:#ipxe,undionly.kpxe --dhcp-boot=tag:ipxe,http://bootcfg.foo:8080/boot.ipxe --log-queries --log-dhcp --dhcp-option=3,172.15.0.1 --address=/bootcfg.foo/172.15.0.2 --address=/tectonic-demo.foo/172.15.0.22

In this case, dnsmasq runs a DHCP server allocating IPs to VMs between 172.15.0.50 and 172.15.0.99 and points iPXE clients to `http://bootcfg.foo:8080/boot.ipxe`. Two DNS entries are set:

    * bootcfg.foo -> 172.15.0.2           (where bootcfg runs)
    * tectonic-demo.foo -> 172.15.0.22    (points to any node we'll setup soon)

## Tectonic Installer

Clone the [tectonic-installer](https://github.com/coreos/coreos-baremetal) source into your `GOPATH`.

    git clone git@github.com:coreos-inc/tectonic.git
    cd tectonic/bootstrap

### Build

Install Go 1.6 and npm 5.6.

    sudo dnf install npm

Then build the bootstrap app.

    cd bootstrap
    ./build

### Run

Run the Tectonic `bootstrap` app which should launch automatically.

    ./bin/linux/bootstrap

Fill in the form fields by running `DEBUG-prefill()` in the broswer console. Use the client TLS credentials corresponding to the server TLS credentials created earlier.

After you click "Ready to Boot", assets needed for `bootkube` will be created in a directory called "cluster". You'll notice, `bootcfg` is now serving various configs.

* [node1's ipxe](http://172.15.0.2:8080/ipxe?mac=52:54:00:a1:9c:ae)
* [node1's Ignition (install)](http://172.15.0.2:8080/ignition?mac=52:54:00:a1:9c:ae)
* [node1's Ignition (provision)](http://172.15.0.2:8080/ignition?mac=52:54:00:a1:9c:ae&os=installed)
* [node1's Metadata](http://172.15.0.2:8080/metadata?mac=52:54:00:a1:9c:ae)
* [node2's Ignition (provision)](http://172.15.0.2:8080/ignition?mac=52:54:00:b2:2f:86&os=installed)

Create VM nodes on the `metal0` bridge, with the appropriate MAC addresses you specified.

    sudo ./scripts/libvirt create-rkt

You can use `virt-manager` to watch the console and reboot VM machines with

    sudo virt-manager

Note that with `libvirt`, you'll need to click "power on" for each machine after the CoreOS install completes - on real machines the reboot will be automatic. The machine should network boot, install CoreOS, and provision themselves with an etcd cluster, a runonce host kubelet, and other bootkube requirements. This process takes several minutes.

### Verify

When finished, you should be able to SSH to any of the nodes.

    ssh core@172.15.0.21
    ssh core@172.15.0.22
    ssh core@172.15.0.23

## bootkube

We're ready to use [bootkube](https://github.com/coreos/bootkube) to create a temporary control plane and bootstrap self-hosted Kubernetes cluster. This is a **one-time** procedure.

Secure copy the generated assets to any one of the master nodes.

    unzip assets.zip
    scp -r assets core@172.15.0.21:/home/core/assets

Connect to the chosen Kubernetes master node,

    ssh core@172.15.0.21

and run the following command *on the node*.

    sudo ./bootkube-start

Watch the temporary control plane logs until the scheduled kubelet takes over in place of the runonce host kubelet.

    I0425 12:38:23.746330   29538 status.go:87] Pod status kubelet: Running
    I0425 12:38:23.746361   29538 status.go:87] Pod status kube-apiserver: Running
    I0425 12:38:23.746370   29538 status.go:87] Pod status kube-scheduler: Running
    I0425 12:38:23.746378   29538 status.go:87] Pod status kube-controller-manager: Running

You may cleanup the `bootkube` assets on the node, but you should keep the copy on your laptop. They contain a `kubeconfig` and may need to be re-used if the last apiserver were to fail and bootstrapping were needed.

### Verify

[Install kubectl](https://coreos.com/kubernetes/docs/latest/configure-kubectl.html) on your laptop. Use the generated kubeconfig to access the Kubernetes cluster. Verify that the cluster is accessible and that the kubelet, apiserver, scheduler, and controller-manager are running as pods.

    $ kubectl --kubeconfig=assets/auth/kubeconfig get nodes
    NAME          STATUS    AGE
    172.15.0.21   Ready     3m
    172.15.0.22   Ready     3m
    172.15.0.23   Ready     3m

    $ kubectl --kubeconfig=assets/auth/kubeconfig get pods --all-namespaces
    NAMESPACE         NAME                                       READY     STATUS    RESTARTS   AGE
    kube-system       kube-api-checkpoint-172.15.0.21            1/1       Running   0          2m
    kube-system       kube-apiserver-tcu18                       2/2       Running   0          3m
    kube-system       kube-controller-manager-2834499578-zn8aq   1/1       Running   0          3m
    kube-system       kube-dns-v11-2259792283-bkiim              4/4       Running   0          3m
    kube-system       kube-proxy-63yf5                           1/1       Running   0          3m
    kube-system       kube-proxy-bolz6                           1/1       Running   0          3m
    kube-system       kube-proxy-nyk4l                           1/1       Running   0          3m
    kube-system       kube-scheduler-4136156790-810g0            1/1       Running   0          3m
    kube-system       kubelet-4cbvl                              1/1       Running   0          3m
    kube-system       kubelet-fq0it                              1/1       Running   0          3m
    kube-system       kubelet-hop52                              1/1       Running   0          3m
    tectonic-system   tectonic-manager-3433579358-mbmi3          1/1       Running   0          3m
    tectonic-system   tectonic-wizard-2008085483-23csr           1/1       Running   0          1m

### Tectonic Wiz

"Wiz is a tool that helps install Tectonic".

Tectonic Wiz should be running on the Kubernetes cluster. Add any of the machine IP addresses to your `/etc/hosts`.

```
# /etc/hosts
172.15.0.22 tectonic-demo.foo
```

Visit [http://tectonic-demo.foo:32002](http://tectonic-demo.foo:32002) and go through the Tectonic Wizard to configure Tectonic components.

Accept the demo defaults which are prepopulated at this time and submit the configuration. This creates some additional Kubernetes manifests, enough so that `tectonic-manager` (still pending) can start.

### Tectonic Manager

Tectonic Manager deploys the Tectonic console. After a few minutes, the Tectonic Console will become available via a Kubernetes Service at NodePort 32000. Visit [https://tectonic-demo.foo:32000](https://tectonic-demo.foo:32000).

Login to the console with "admin@tectonic.com" and the password "theadminpassword".

### Cleanup

Press ^] three times to stop the `bootcfg` and `dnsmasq` rkt pods.

Next, destroy the client machines when you're finished.

    sudo ./scripts/libvirt destroy
