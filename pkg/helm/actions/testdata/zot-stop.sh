#!/bin/bash

kill -TERM $(< zot.pid) || echo "Zot (TLS) is not currently running."
kill -TERM $(< zot-no-tls.pid) || echo "Zot (no TLS) is not currently running."
kill -TERM $(< zot-basicauth.pid) || echo "Zot (basic auth) is not currently running."
rm -f zot.pid zot-no-tls.pid zot-basicauth.pid
