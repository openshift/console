#!/bin/bash
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -subj  "/C=DE/ST=NRW/L=Berlin/O=My Inc/OU=DevOps/CN=localhost/emailAddress=dev@www.example.com"  -out ca.crt

openssl req -newkey rsa:2048 -nodes -keyout server.key -subj  "/C=DE/ST=NRW/L=Berlin/O=My Inc/OU=DevOps/CN=localhost/emailAddress=dev@www.example.com" -out server.csr

openssl x509 -req -extfile <(printf "subjectAltName=DNS:localhost") -days 365 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt