# tectonic-manager

This repo implements the Tectonic Manager product.
It is comprised by a "tectonic-manager" pod that uses the Kubernetes API to deploy Tectonic Console.

Deploying the tectonic-manager pod requires an existing Kubernetes cluster with the following features:

- service accounts & tokens
- functioning service DNS

## Building individual parts

See the [global project README](../README.md) for tool requirements and versions.

### tectonic-identity (dex)

The tectonic-identity image is dex with custom static assets. To update tectonic-identity, update `Dockerfile-dex` to use the dex version you'd like to build from.

Use the version of the dex image with a unique number starting from 1 ("1", "2", "3", etc...) to version the tectonic-identity image. This way we can build multiple images from a single dex version. See the [existing tags](https://quay.io/repository/coreos/tectonic-identity?tab=tags) for examples.

```
docker build -t quay.io/coreos/tectonic-identity:${DEX_SHA}.${N} -f Dockerfile-dex .
docker push quay.io/coreos/tectonic-identity:${DEX_SHA}.${N}
```

Finally update the refrence in `pkg/app/app_identity.go` to point to the new image.

## dev deploy

The `./dev/` directory in this repo encompasses the scripts and artifacts needed to deploy a development version of Tectonic Manager using a pre-configured kubectl CLI tool.
Read on to walk through this deployment process.

### Kubernetes

#### Step 1: Clone coreos-kubernetes

```
git clone https://github.com/coreos/coreos-kubernetes
```

#### Step 2: Apply patch exposing Docker socket

The current development process involves building docker images using a remote docker host. This patch will expose the docker socket from the single-machine Kubernetes cluster.

In your coreos-kubernetes clone, create the file `single-node/docker-host.patch`

```diff
diff --git a/single-node/user-data b/single-node/user-data
index 2bda7f9..8a20188 100644
--- a/single-node/user-data
+++ b/single-node/user-data
@@ -766,6 +766,16 @@ After=flanneld.service
 EOF
     }

+    local TEMPLATE=/etc/systemd/system/docker.socket.d/40-listen-stream.conf
+    [ -f $TEMPLATE ] || {
+        echo "TEMPLATE: $TEMPLATE"
+        mkdir -p $(dirname $TEMPLATE)
+        cat << EOF > $TEMPLATE
+[Socket]
+ListenStream=2376
+EOF
+    }
+
     local TEMPLATE=/etc/kubernetes/cni/net.d/10-calico.conf
     [ -f $TEMPLATE ] || {
         echo "TEMPLATE: $TEMPLATE"
```

Then apply the patch:

```
git apply docker-host.patch
```

TODO(aaron): Come up with a better process than the above

#### Step 3: Launch Kubernetes Development Node

```
cd single-node
vagrant up
```

#### Step 4: Configure kubectl

Configure `kubectl` for the single node cluster and set it as the current context.

```
kubectl config set-cluster vagrant --server=https://172.17.4.99:443 --certificate-authority=${PWD}/ssl/ca.pem
kubectl config set-credentials vagrant-admin --certificate-authority=${PWD}/ssl/ca.pem --client-key=${PWD}/ssl/admin-key.pem --client-certificate=${PWD}/ssl/admin.pem
kubectl config set-context vagrant --cluster=vagrant --user=vagrant-admin
kubectl config use-context vagrant
```

Inspect the cluster to see a single node.

```
kubectl get nodes
```

Now continue with tectonic-manager deployment.

### Build Assets

Set the Docker host to use the socket exposed above and run make to build the tectonic-manager binaries and Docker assets.

```
DOCKER_API_VERSION=1.22 DOCKER_HOST=172.17.4.99:2376 make
```

Inspect the generated images on the single node.

```
DOCKER_API_VERSION=1.22 DOCKER_HOST=172.17.4.99:2376 docker images
```

### license

A Tectonic license must exist at `./dev/license`.
Use the `tectonic-license` tool to generate one for development purposes like so:

```
eval $(go env)
.workspace/tec/bin/${GOOS}_${GOARCH}/tectonic-license \
    -key="dev-signing-key.pem" \
    -license-accountID="fakeaccountid" \
    -license-account-secret="fakereportingsecret" \
    > dev/license
```

### dockercfg

A valid dockercfg must exist at `./dev/dockercfg`. You can get one by

* signing in to quay.io with your @coreos.com email address
* navigating to the coreos organization
* creating a robot account for yourself
* clicking on that new robot account, which will show a dialog allowing you to download your dockercfg

You'll also need to add your robot to a team that has read permissions
for the assets used by tectonic manager. For development, that's the
[tectonicdev](https://quay.io/organization/coreos/teams/tectonicdev)
team in the coreos organization. After you've created your robot
account, navigate to the tectonicdev team (under "Teams and
Membership") and add your robot account to the tectonicdev team.

### deploy

Use the `./dev/spin` script to deploy Tectonic Manager components against the Kubernetes cluster with `kubectl`.
If using a custom `KUBECONFIG`, be sure to set that environment variable prior to runnin the spin scripts.
Set environment variables to point to the CA cert and key generated by coreos-kubernetes:

```
export TECTONIC_CA_CERT=~/coreos-kubernetes/single-node/ssl/ca.pem
export TECTONIC_CA_KEY=~/coreos-kubernetes/single-node/ssl/ca-key.pem

#optional
#KUBECONFIG=/path/to/my/custom/kubeconfig

./dev/spin up
```

All artifacts are created in the `tectonic-dev` namespace.
Check on the tectonic-manager pod by specifying this namespace:

```
kubectl get --namespace=tectonic-dev pods
```

The Tectonic Console will become available via a Kubernetes Service at NodePort 32000.
If using single-node coreos-kubernetes, navigate to [https://172.17.4.99:32000](https://172.17.4.99:32000).

Log in to the console with "admin@tectonic.com", and the password given by:

```
kubectl get --namespace=tectonic-dev secret tectonic-identity-admin-password -o template --template="{{ .data.password }}" | base64 --decode
```

If you add additional users and want to login with that user you can get the password reset link from the dex worker logs:

```
kubectl logs tectonic-identity-worker-RANDOMSTUFF --namespace=tectonic-dev
```

### deploy and block until ready

Alternatively, you can run:

```
./dev/spin around
```

This script will not finish executing until the admin password has been created, which indicates that console is running and can be logged into. At the end of the script the password is output on the command line.

### destroy

Tear down Tectonic Manager using the `./dev/spin` script:

```
./dev/spin down
```
