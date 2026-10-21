#!/bin/bash
echo quit | openssl s_client -showcerts -servername localhost -connect localhost:9443 > cacert.pem
