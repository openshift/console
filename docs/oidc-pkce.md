# PKCE for direct external OIDC login

When Console authenticates directly to an external OpenID Connect provider,
it uses PKCE with the S256 challenge method only if successful provider discovery
explicitly includes the exact string `S256` in `code_challenge_methods_supported`.
This does not change Console authentication to the integrated OpenShift OAuth
server, including deployments where that server delegates to an external identity
provider. It does not change the OAuth server's own identity-provider integration.

| Successful discovery metadata | Console authorization and code exchange |
| --- | --- |
| Methods include `S256`, with or without `plain` | S256 challenge at authorization; independent verifier at code exchange |
| Methods absent, empty, or only `plain`/unknown strings | Existing non-PKCE OAuth requests, without challenge or verifier |

A provider that **requires PKCE but does not advertise S256 is unsupported** under
this policy. Login may be rejected by that provider. Console does not infer PKCE
support from an error, retry without PKCE, or downgrade to `plain`. Provider names
alone do not establish compatibility: discovery and the application's enforcement
policy both matter. CLI implementations may choose PKCE differently; this policy
does not promise universal equivalence with `oc login`.

## Discovery and login transactions

Invalid capability metadata (including null, non-array values, or non-string array
members) is a discovery error, not a successful non-PKCE advertisement. Initial
discovery uses the existing retry/initialization-failure behavior. Failed background
refresh retains the last successfully validated provider and capability together.

Every direct external OIDC login, including non-PKCE login, has its own authenticated
and encrypted transaction cookie. It binds the selected mode, state, issuer,
client and redirect URI; S256 transactions also contain an independently generated
secret verifier. A later discovery refresh does not change an in-flight login's
mode. Transactions expire on the server after five minutes, even if a browser
resends an expired cookie. Missing, invalid or expired transactions require a new
login; legacy plaintext state cookies are not accepted for direct external OIDC.

Transaction cookies are HttpOnly, host-only, and explicitly SameSite Lax for the
existing top-level GET authorization callback. Secure follows Console's existing
secure-cookie setting; use HTTPS and secure cookies in production. Cookie Path is
the directory of the externally visible callback, including any base-path prefix,
not the authenticated API-session path. This does not add `form_post` support.

Each tab has an independent transaction. A callback consumes its own browser cookie
without deleting other pending logins. The issuer must enforce one-use authorization
codes. Cookie deletion and code single-use reject ordinary replay; a stateless
cookie is not a distributed record of consumption and cannot guarantee global
invalidation of a stolen and manually restored cookie. Protect cookies and codes
as credentials; do not publish raw callback URLs, HAR files or cookie values.

## Redirects, replicas and keys

Register the exact callback URI for every configured allowed Console hostname,
including port and base path where applicable. Authorization and token exchange
must use the same selected URI. Switching hostname during a login is not supported;
host-only cookies are not shared across alternate hosts. Unapproved hosts do not
gain dynamic redirect privileges.

The transaction uses the existing configured cookie authentication and encryption
keys. It is encoded with the current key pair and can be decoded with the current
or complete configured previous pair. Replicas handling the same login must share
compatible key material, issuer/client/redirect configuration, and synchronized
clocks. This does not remove existing authenticated-session routing requirements.

Key files are loaded during configuration completion; do not assume hot reload.
A replica with the new current pair and old previous pair can accept old cookies,
but an unprepared old replica cannot decode newly issued cookies. Follow the
deployment's supported key-rotation procedure so all decoders accept the issuing
keys, or coordinate a drain/restart and allow affected users to start a fresh login.
Missing previous keys can force reauthentication; there is no unsigned-cookie or
per-replica random-key fallback for direct external OIDC transactions.

## Mixed-version deployments and troubleshooting

New external OIDC transactions do not emit legacy plaintext state cookies. A login
started on an older Console cannot complete on a new handler without a protected
transaction, and an old handler cannot validate a new transaction. Both directions
require a fresh login. Integrated OpenShift state-cookie compatibility is unchanged.

Use compatible-version routing if available, or drain old login traffic and allow
the five-minute in-flight transaction window plus routing/clock margin before
switching handlers. Otherwise transient login failures can occur until replicas
converge; start a fresh login afterward. This applies to rollback as well and does
not intentionally invalidate already authenticated sessions. It is not a guarantee
of seamless mixed-version login or a release-specific upgrade contract.

For failed login, check successful discovery's S256 advertisement, issuer app policy,
registered callback URI, browser cookie attributes, clock synchronization, replica
key compatibility and handling versions. A transport/discovery error is not the
same as an absent methods field. Retry by starting a fresh login, not by editing
or restoring a transaction cookie. Never log or share verifiers, authorization
codes, tokens, state values or cookie contents. Refresh-token and logout behavior
are unchanged; the login verifier is not retained in the authenticated session.
