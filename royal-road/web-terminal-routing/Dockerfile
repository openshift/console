# Build context: this directory.
FROM docker.io/library/golang:1.26 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags=-s -o /web-terminal-routing .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /web-terminal-routing /web-terminal-routing
USER 65532:65532
ENTRYPOINT ["/web-terminal-routing"]
