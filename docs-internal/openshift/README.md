# Running Console with OpenShift

This guide covers local development by running a local Console connected to a remote OpenShift cluster.

First, create an `OAuthClient` resource with a generated secret and read that secret.

```
sed "s/OAUTH_SECRET/$( uuid )/g" bridge-oauth-client.yaml.tmpl | kubectl apply -f -
export OAUTH_SECRET=$( kubectl get oauthclient tectonic-console -o jsonpath='{.secret}' )
```

If the CA bundle of the OpenShift API server is unavailable, fetch the CA certificates from a service account secret. Otherwise copy the CA bundle to `ca.crt`.

```
kubectl get secrets -n default --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."service-ca.crt"' -r | base64 -d > ca.crt
```

Set the `OPENSHIFT_API` environment variable to tell the script the API endpoint.

```
export OPENSHIFT_API="https://ec2-54-91-246-166.compute-1.amazonaws.com:8443"
```

Finally run the console and visit [localhost:9000](http://localhost:9000).

```
./run.sh
```
