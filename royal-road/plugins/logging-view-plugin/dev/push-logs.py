#!/usr/bin/env python3
"""Ship realistic log lines to VictoriaLogs' Loki push API with the labels
production's Grafana Alloy sets: namespace, pod, container, deployment or
statefulset (derived from the pod name with Alloy's regexes), and level and
log_type as alloy-modules' log-levels module extracts them (raw spellings).

Usage: push-logs.py <push-url> [--backfill-minutes N] [--follow]
  push-url: http://<victorialogs>:9428/insert/loki/api/v1/push
Pods are read with kubectl (KUBECONFIG) from team-a, team-b and kube-system.
"""
import argparse
import json
import random
import re
import subprocess
import time
import urllib.request

NAMESPACES = ["team-a", "team-b", "kube-system"]

# (level label, log_type, line template) in the formats the log-levels module parses.
FORMATS = [
    ("INFO", "klog", "I{md} {hms}.000000       1 server.go:{n}] handled GET /api/items status=200 duration={ms}ms"),
    ("INFO", "klog", "I{md} {hms}.000000       1 cache.go:{n}] cache refreshed entries={n}"),
    ("WARN", "klog", "W{md} {hms}.000000       1 client.go:{n}] slow response from upstream, retrying in {ms}ms"),
    ("ERROR", "klog", "E{md} {hms}.000000       1 db.go:{n}] query failed: context deadline exceeded"),
    ("INF", "zerolog", "{iso} INF request served path=/healthz status=200"),
    ("ERR", "zerolog", "{iso} ERR payment declined order={n} reason=timeout"),
    ("DBG", "zerolog", "{iso} DBG token refreshed user={n}"),
    ("warning", "unknown", "level=warning msg=\"disk usage high\" percent={pct}"),
    ("info", "unknown", "{{\"level\":\"info\",\"msg\":\"job finished\",\"items\":{n}}}"),
    ("unknown", "unknown", "listening on :8080"),
]
WEIGHTS = [30, 20, 8, 4, 15, 4, 6, 5, 6, 2]


def pods():
    out = subprocess.check_output(["kubectl", "get", "pods", "-A", "-o", "json"])
    for item in json.loads(out)["items"]:
        ns = item["metadata"]["namespace"]
        if ns in NAMESPACES:
            for c in item["spec"]["containers"]:
                yield ns, item["metadata"]["name"], c["name"]


def labels(ns, pod, container, level, log_type):
    result = {"namespace": ns, "pod": pod, "container": container, "level": level, "log_type": log_type}
    # Alloy's discovery.relabel rules
    if m := re.match(r"^(.*)-[0-9a-f]+-[^-]+$", pod):
        result["deployment"] = m.group(1)
    if m := re.match(r"^(.*)-[0-9]+$", pod):
        result["statefulset"] = m.group(1)
    return result


def line(template, ts):
    t = time.gmtime(ts)
    return template.format(
        md=time.strftime("%m%d", t),
        hms=time.strftime("%H:%M:%S", t),
        iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", t),
        n=random.randint(1, 9999),
        ms=random.randint(1, 900),
        pct=random.randint(80, 99),
    )


def push(url, entries):
    streams = {}
    for ts, lbls, text in entries:
        key = json.dumps(lbls, sort_keys=True)
        streams.setdefault(key, {"stream": lbls, "values": []})["values"].append([str(int(ts * 1e9)), text])
    body = json.dumps({"streams": list(streams.values())}).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/json"})
    urllib.request.urlopen(req).read()


def batch(targets, start, end, step):
    entries = []
    ts = start
    while ts < end:
        ns, pod, container = random.choice(targets)
        level, log_type, template = random.choices(FORMATS, WEIGHTS)[0]
        entries.append((ts, labels(ns, pod, container, level, log_type), line(template, ts)))
        ts += step * random.uniform(0.5, 1.5)
    return entries


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--backfill-minutes", type=int, default=120)
    parser.add_argument("--follow", action="store_true")
    args = parser.parse_args()

    targets = list(pods())
    now = time.time()
    entries = batch(targets, now - args.backfill_minutes * 60, now, 2.0)
    for i in range(0, len(entries), 500):
        push(args.url, entries[i : i + 500])
    print(f"pushed {len(entries)} lines for {len(targets)} containers")

    while args.follow:
        time.sleep(2)
        now = time.time()
        push(args.url, batch(targets, now - 2, now, 0.5))


if __name__ == "__main__":
    main()
