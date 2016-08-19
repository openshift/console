# Tectonic Identity

## Components

### Kubernetes API Server

The Kubernetes API Server is expected to enable it's [OpenID Connect plugin](
http://kubernetes.io/docs/admin/authentication/), deferring to Dex for
authentication. This requires configuring the following flags on the API Server

```
--oidc-issuer-url={{ Dex's URL without a path }} \
--oidc-client-id={{ kubectl's client_id }} \
--oidc-username-claim="email" \
...
```

You can also configure a custom CA.

Note that the API Server is given kubectl's client_id and is not assigned a
secret. __The API Server is not a Dex client__, but will only trust ID Tokens
issued for a the provided client. In this case Kubernetes will only trust ID
Tokens issued to kubectl. A work around for Console will be discussed later. 

### Kubectl

Kubectl is expected to communicate only with the API Server. All kubectl
instances share a client_id and client_secret, and the client_secret isn't
considered private. In Dex terms it's a [public client](
https://github.com/coreos/dex/blob/master/Documentation/clients.md#public-clients).

When requesting an ID Token, kubectl should use the following scopes:

```
openid
email
profile
offline_access
```

And the following redirect_uri:

```
urn:ietf:wg:oauth:2.0:oob
```

This special redirect_uri will prompt the user to login then display a OAuth2
code like the one below.

![](https://developers.google.com/accounts/images/installedresult.png)

That code can be redeemed for an ID Token and refresh token.

### Console

Console must communicate with both Kubernetes and Dex. Because of this, Console
is considered an "admin client" for Dex, meaning it can communicate with
various user management APIs. However to be trusted by both Kubernetes and Dex,
ID Tokens have to be issued for both Console and kubectl.

Console accomplishes this through ["cross client authorization"](
https://github.com/coreos/dex/blob/master/Documentation/clients.md#cross-client-authorization).
When kubectl is created (or some time later) tectonic-manager uses the Dex api
to cause kubectl to "trust" the Console. This allows Console to mint tokens on
behalf of kubectl.

When logging in a user, Console must pass the following scopes.

```
openid
email
profile
audience:server:client_id:{{ kubectl's client_id }}
audience:server:client_id:{{ console's client_id }}
```

This will cause Dex to mint an ID Token that is for both Console and kubectl
allowing Console to both authenticate with Kubernetes and the Dex APIs.

### Dex dev setup

For console development, you can set up Dex in dev mode using a client config
file. Allocate a client ID and secret for bridge and a public client for kubectl.

```json
[
  {
    "id": "bridge",
    "secret": "YnJpZGdlX3NlY3JldA==",
    "redirectURLs": ["http://0.0.0.0:9000/auth/callback"]
  },
  {
    "id": "kubectl",
    "secret": "a3ViZWN0bF9zZWNyZXQ=",
    "public": true,
    "trustedPeers": ["bridge"]
  }
]
```

Build Dex using master and run the worker `--no-db` mode pointing at the file
above.

```
./build
./bin/dex-worker --no-db --clients clients.json
```
