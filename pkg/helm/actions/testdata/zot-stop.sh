#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/../../testdata/stop_fixture.sh"

stop_fixture zot.pid zot "Zot (TLS)"
stop_fixture zot-no-tls.pid zot "Zot (no TLS)"
stop_fixture zot-basicauth.pid zot "Zot (basic auth)"
