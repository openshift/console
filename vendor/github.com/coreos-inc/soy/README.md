Soy
===

RPC Server and tools for managing customer billing data

# Required Dependencies

```
go get -u github.com/gogo/protobuf/{proto,protoc-gen-gogo,gogoproto,protoc-gen-gofast}
```

Install glide 0.10.2:

https://github.com/Masterminds/glide/releases/tag/0.10.2

Install glide vc to stripe unused dependencies:

```
go get -u github.com/sgotti/glide-vc
```

# Building

The build-all script will build everything you need from scratch.
```
./build-all
```

To compile just the Go code run:
```
./build
```

To only generate the protobuf go code run:
```
./protoc_gen
```

# Vendoring

We use the vendor experiment so you need to set `export GO15VENDOREXPERIMENT=1`.
Additionally we use glide. Modify dependency versions in the `glide.yaml` if
you wish to update a dependency, and then run `./scripts/glide-upgrade.sh`.
`./scripts/glide-install.sh` is useful to install the dependencies at the last
known working version, according to the `glide.lock` file.

## Migrations

Migrations are managed via [tern](https://github.com/jackc/tern).
To get started, copy `migrations/tern.conf.example` to `migrations/tern.conf` and fill in the required values.
Refer to tern documentation regarding migrating up / down / checking status.

## Running Tests

Ensure all testable packages are configured in the `./test` script set in the `TESTABLE` variable.
The following comand will build everything, run migrations against a `soy_test` database, and run all tests against `soy_test` too.
```
./test
```

## Configuring

### General Info

The apps (`server`, `worker`, `hookhandler`) can be configured via a app specific config file (expected to be located in either `/etc/{app-name}/config.yaml` or `$CWD/config/{app-name}/config.yaml`), environment variables, or through command line flags.

The order of importance for configuration values is: command line flags, env vars, config file, default value.

### Environment variables

Each app will attempt to read configuration from the environment. In order to use an environment variable to configure the app, simple take a command line flag, replace "-" with "\_", and prefix with the app name. For example, to set the `pg-dsn` value for the `soy server` app, use the following env var:

`SOY_SERVER_PG_DSN=postgres://foo@bar/soy`

### Config file

An example config file is placed in `$CWD/config/{app-name}/config.yaml.example`. To add config values, simply copy the example file omitting the `.example` extension and set the values you want.

## Running

### Soy RPC Server

This is the RPC server that handles all requests and does all business logic and calling out to the BillForward API.
Run locally for development with the following required flags:

Command: `soy server`

Example:
```
./bin/soy server \
    --log-level=debug \
    --billforward-token=$SOY_BILLFORWARD_TOKEN \
    --pg-dsn="postgres://127.0.0.1:5432/soy_dev?sslmode=disable" \
    --publisher-type="postgres" \
    --aggregating-plan-id=$SOY_AGGREGATING_RATEPLAN_ID \
    --license-signing-key=./static/fake-license-signing-key.key
```

- `billforward-token`: get from the BillForward UI
- `publisher-type`: this should always be `postgres`
- `aggregating-plan-id`: get from BillForward UI/API. There should be only 1 and it's the RatePlan Id for the aggregating monthly subscription.
- `license-signing-key`: private key used to sign licenses. Use the fake one for dev/staging only.

### Creme Web UI

What the end-users see and interact with. It authenticates with Dex, uses stripe for credit card capture, and connects to the Soy RPC server for all other operations.
Use some varition of the following flags/env-vars (creme does not support a yaml config file).

```
CREME_LOG_LEVEL=debug
CREME_AUTH_CLIENT_ID=<dex-oauth2-client-id>
CREME_AUTH_CLIENT_SECRET=<dex-oauth2-client-secret>
CREME_AUTH_REDIRECT_HOST=http://127.0.0.1:9003/auth/callback
CREME_HOST=http://127.0.0.1:9003
CREME_AUTH_ISSUER_URL=http://127.0.0.1:5556
CREME_STRIPE_PUBLISHABLE_KEY=
CREME_STRIPE_PRIVATE_KEY=
CREME_RPC_ENDPOINT=127.0.0.1:8181
CREME_HEALTH_ENDPOINT=http://127.0.0.1:8182
CREME_PUBLIC_DIR=./creme/web/public
CREME_LICENSE_PUBLIC_KEY=./static/fake-license-signing-key.pub

./bin/creme
```

- `CREME_LICENSE_PUBLIC_KEY`: published public key at `/keys` for license validators to use when checking.
- `CREME_RPC_ENDPOINT`: endpoint of the Soy RPC server.
- `CREME_HEALTH_ENDPOINT`: http endpoint for Soy RPC server health checks.
- `CREME_PUBLIC_DIR`: directory from which to server public assets (JavaScript, HTML, CSS).
- `CREME_AUTH_CLIENT_ID`, `CREME_AUTH_CLIENT_SECRET`, and `CREME_AUTH_REDIRECT_HOST`: created with `dexctl new-client http://127.0.0.1:9003/auth/callback`
- `CREME_AUTH_ISSUER_URL`: URL of the dex instance in use during development
- `CREME_HOST`: Must be the same as the scheme+host+port portion of `CREME_AUTH_ISSUER_URL`

### Hook Handler

A lightweight webserver that simply listens for whitelisted webhook events from BillForward. Once events we care about are triggered, the various handlers call out to Soy RPC endpoints to do work.

Configure the webhook in BillForward's UI under "setup" then "webhooks" with HTTP Basic Auth as: `https://<user>:<pass>@<host>:<port>`

Command: `soy hookhandler`

Example:
```
./bin/soy hookhandler --auth-username=<basic-auth-username> --auth-password=<basic-auth-password>
```

- `auth-username`: used in BillForward's webhook configuration.
- `auth-password`: used in BillForward's webhook configuration.

### Quay Account Worker

Processes async jobs related to creating Quay.io robot accounts for a billing account, and ensures the robot account is added/removedl to the correct teams corresponding to private repo pull access.

Command: `soy worker postgres quay-account`

Example:
```
./bin/soy worker \
    postgres \
    --log-level=debug \
    --pg-dsn='postgres://localhost:5432/soy_dev?sslmode=disable' \
    quay-account \
    --quay-api-key=$QUAY_API_KEY \
    --quay-organization=coreosstaging \
    --quay-prefix=dev_
```

- `quay-organization`: for staging and dev should always be `coreosstaging`, for prod use `coreos`
- `quay-prefix`: a unique prefix for robot account names. In dev make it whatever you want to distinguish your robots from others. In prod always use `tec_`

### License Generator Worker

This generates a new versioned account license every time a subscription is created or modified.

Command: `soy worker postgres license`

Example:
```
./bin/soy worker \
    postgres \
    --log-level=debug \
    --pg-dsn='postgres://localhost:5432/soy_dev?sslmode=disable' \
    license
```
