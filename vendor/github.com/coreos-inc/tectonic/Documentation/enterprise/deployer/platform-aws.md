## Install a New Cluster

### Step 1: Deploy a Kubernetes cluster

Use the [AWS Deploy Tool](https://coreos.com/kubernetes/docs/latest/kubernetes-on-aws.html) to install a scalable cluster using CloudFormation.

Tectonic uses reserved Node ports for all Tectonic services.
Ensure the following port range is not used on any of your nodes (default):
```
32000-32100
```

### Step 2: Configure Load Balancer

Creating an ELB will enable external access to Tectonic services running in the cluster like Tectonic Console and Tectonic Identity.

Using the AWS UI or CLI do the following:

#### Create a Load Balancer

Create a new ELB with the following configuration settings:

Edit Instances: Add all worker instances (created in step 1)

Edit Listeners:

| Load Balancer Protocol | Load Balancer Port | Instance Protocol | Instance Port | Cipher | SSL Certificate |
|:--|:--|:--|:--|:--|:--|
| TCP | 32000 | TCP | 32000 | N/A | N/A |
| TCP | 32001 | TCP | 32001 | N/A | N/A |


Edit Health Check:

- Ping Protocol: `HTTPS`
- Ping Port: `32001`
- Ping Path: `/health`

Edit the ELB security group inbound traffic:

| Type | Protocol | Port Range | Source |
|:--|:--|:--|:--|
| Custom TCP Rule | TCP | 32000 - 32001 | 0.0.0.0/0 |

Edit the ELB security group outbound traffic:

| Type | Protocol | Port Range | Destination |
|:--|:--|:--|:--|
| All traffic | All | 0 - 65535 | Anywhere 0.0.0.0/0 |

#### Configure Load Balancer DNS

Configuring DNS will allow you to access Tectonic Console via a more friendly URL like:

```
tectonic.example.com
```

Note the DNS name of your load balancer from the previous step, something like:

```
my-elb-example.us-west-2.elb.amazonaws.com
```

If using Route53 DNS refer to the [AWS documentation on Using Domain Names with ELB](http://docs.aws.amazon.com/ElasticLoadBalancing/latest/DeveloperGuide/using-domain-names-with-elb.html)

If using another DNS hostng provider, simply configure a new CNAME record as (this example configures `tectonic` as the subdomain of your primary domain name):

```
Name: tectonic
Type: CNAME
Value: my-elb-example.us-west-2.elb.amazonaws.com
```

Make note of the name you configure here as the correct value will be required in step 4.

#### Edit the EC2 worker nodes security group

Worker node ports need to be opened to allow external access to Tectonic Console and Tectonic Identity.

Edit the worker security group inbound rules:

| Type | Protocol | Port Range | Source |
|:--|:--|:--|:--|
| Custom TCP Rule | TCP | 32000 - 32001 | Custom `<your-elb-security-group>` |

### Step 3: Deploy Tectonic Installer Services

Start by creating the `tectonic-system` Kubernetes namespace.
This namespace will contain all Tectonic-related objects:

```sh
$ kubectl create ns tectonic-system
```

Download the manifest for the [Tectonic Installer][manager-manifest] and submit it to the cluster:

```sh
$ kubectl create -f tectonic-manager.yaml --namespace=tectonic-system
```

Verify the pods are created and have a status of "Running" (this may take a few minutes):

```sh
$ kubectl get pods --namespace=tectonic-system
NAME                                READY     STATUS    RESTARTS   AGE
tectonic-manager-3433579358-92l04   1/1       Running   0          37s
tectonic-wizard-2008085483-8utgs    1/1       Running   0          27s
```

### Step 4. Tectonic Install Wizard

The Tectonic Install Wizard is a tool that helps install Tectonic.
It should now be running in your cluster but is not accessible externally.
To access the installer proxy to it via kubectl.

{% raw %}
```sh
$ kubectl get pods -l app=tectonic-wizard -o template --template="{{range.items}}{{.metadata.name}}{{end}}" --namespace=tectonic-system | xargs -I{} kubectl port-forward {} 4445 --namespace=tectonic-system

Forwarding from 127.0.0.1:4445 -> 4445
Forwarding from [::1]:4445 -> 4445
Handling connection for 4445
```
{% endraw %}

Navigate your browser to `http://127.0.0.1:4445`.

Follow the on-screen instructions to configure Tectonic components, such as cluster-wide SSO, Tectonic Identity, and the Tectonic Console.

**Be sure to use the DNS name you configured in Step 2 for the Certificate Common Name, and the Tectonic URL.**

After the Wizard is complete, your cluster is ready to use.
Follow the onscreen instructions to access Tectonic Console, using the admin user/password you provided during setup to login.

You can now safely exit the kubectl port-forward process with `ctrl+c`.


### 5. Tectonic Console

You are ready to deploy your first application to the cluster!

For those new to Kubernetes, the [official Kubernetes User Guide](http://kubernetes.io/v1.0/index.html) contains tutorials and guides demonstrating how to get started with Kubernetes.

Follow the [official Quay Enterprise installation guide](quay_enterprise.md) to deploy a full-featured docker image registry onto your Kubernetes cluster.


## Full Uninstall

This is useful if you would like to revert all Tectonic components for a completely fresh Tectonic installation to the same cluster.

WARNING: these actions are irreversable.

### Remove Tectonic Components

Delete all the tectonic resources:
```sh
$ kubectl delete ns tectonic-system
namespace "tectonic-system" deleted
```

### Cleanup PostgreSQL Data

Removing all Tectonic related PostgreSQL data is required to avoid conflicts if you are planning another installation.

#### External PostgreSQL

Drop the database named: `tectonic_identity`.

#### Tectonic Auto-Deployed PostgreSQL

If you chose to run PostgreSQL in-cluster, simply delete all database data on disk.

Since the PostgreSQL data is pinned to one worker node, you may have to login to all worker nodes before you find the data directory.
```sh
$ ssh -i <your-aws-key>.pem core@<worker-node-ip>
```

On the remote machine:
```sh
$ rm -rf /var/lib/postgres
```

[manager-manifest]: files/tectonic-manager.yaml
