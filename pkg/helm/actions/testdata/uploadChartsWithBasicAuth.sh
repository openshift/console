#!/bin/bash
cd ../testdata/
curl --user AzureDiamond:hunter2 --data-binary "@mariadb-7.3.5.tgz" http://localhost:8181/api/charts
curl --user AzureDiamond:hunter2 --data-binary "@mychart-0.1.0.tgz" http://localhost:8181/api/charts
curl --user AzureDiamond:hunter2 --data-binary "@influxdb-3.0.2.tgz" http://localhost:8181/api/charts
