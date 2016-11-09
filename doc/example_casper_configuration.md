# Example Casper Configuration

The following JSON snippet shows an example of a valid Casper configuration that can be used by the Console, Console Proxy, or Casper Service:

```json
{
    "kubectl-client-id": "some_id_1",
    "kubectl-client-secret": "some_secret_1",
    "oidc-client-id": "some_id_2",
    "oidc-client-secret": "some_secret_2",
    "url": "https://phillips.example.com:443",
    "console": "http://console.example.com",
    "clusters": {
        "cluster_id_1": {
            "name": "cluster 1",
            "endpoint": "https://cluster.endpoint1.example.com:443",
            "ca": "cluster_ca_certificate"
        }
    }
}
```

This configuration provides all of the data necessary to proxy and authenticate requests from a hosted Console to a cluster.
