#!/bin/bash

# stop_fixture stops the process recorded in a PID file and waits until it
# exits. SIGKILL follows SIGTERM when the process is still the expected
# binary. A PID that belongs to a different command is left alone so
# parallel packages do not stop each other's fixtures (see OCPBUGS-115318).
# The PID file is removed only when that command is stopped, or when the
# PID is valid but the process is no longer running. An invalid PID or a
# different command leaves the file in place: it may belong to another
# package, or it may not be a PID file.
#
# Usage: stop_fixture <pidfile> <command-name> <label>
stop_fixture() {
  local pidfile=$1
  local comm=$2
  local label=$3
  if [ ! -f "$pidfile" ]; then
    return
  fi
  local pid
  pid=$(< "$pidfile")
  if ! [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
    echo "$label ($pidfile) contains invalid PID: $pid" >&2
    return
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "$label is not currently running."
    rm -f "$pidfile"
    return
  fi
  if [[ "$(ps -p "$pid" -o comm= 2>/dev/null)" != "$comm" ]]; then
    echo "$label ($pidfile): PID $pid is not $comm, skipping" >&2
    return
  fi
  rm -f "$pidfile"
  kill -TERM "$pid" 2>/dev/null || true
  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return
    fi
    sleep 0.5
  done
  if [[ "$(ps -p "$pid" -o comm= 2>/dev/null)" == "$comm" ]]; then
    kill -KILL "$pid" 2>/dev/null || true
  fi
}
