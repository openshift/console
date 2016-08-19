FROM postgres:9.5

RUN mkdir -p /docker-entrypoint-initdb.d
COPY initdb-scripts/* /docker-entrypoint-initdb.d/

