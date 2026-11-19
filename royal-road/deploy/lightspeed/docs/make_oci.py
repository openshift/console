#!/usr/bin/env python3
"""Write a directory as a one-layer OCI image layout (FROM scratch), stdlib only.

  make_oci.py SRC_DIR OUT_LAYOUT [--label key=value ...]

The index image is data only, so no container engine is needed: this writes
the layer tarball, config and manifest, and `skopeo copy oci:OUT_LAYOUT
docker://...` pushes it. No privileges (buildah's layer apply needs mounts
that restricted nodes refuse), and the output is reproducible: files sorted,
owner 0:0, mode 0644/0755, mtime 0, gzip header without name or time. The
same index content therefore always has the same digest.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import os
import shutil
import tarfile
from pathlib import Path


def layer_tar(src: Path) -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w", format=tarfile.PAX_FORMAT) as tar:
        for path in sorted(src.rglob("*")):
            rel = path.relative_to(src).as_posix()
            info = tarfile.TarInfo(rel)
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            info.mtime = 0
            if path.is_dir():
                info.type, info.mode = tarfile.DIRTYPE, 0o755
                tar.addfile(info)
            elif path.is_file():
                info.size, info.mode = path.stat().st_size, 0o644
                with path.open("rb") as f:
                    tar.addfile(info, f)
    return buf.getvalue()


def blob(layout: Path, data: bytes) -> tuple[str, int]:
    digest = hashlib.sha256(data).hexdigest()
    (layout / "blobs" / "sha256" / digest).write_bytes(data)
    return f"sha256:{digest}", len(data)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("src")
    p.add_argument("out")
    p.add_argument("--label", action="append", default=[], help="key=value")
    args = p.parse_args()

    src, layout = Path(args.src), Path(args.out)
    if layout.exists():
        shutil.rmtree(layout)
    (layout / "blobs" / "sha256").mkdir(parents=True)

    raw = layer_tar(src)
    gz = io.BytesIO()
    with gzip.GzipFile(filename="", mode="wb", fileobj=gz, mtime=0, compresslevel=6) as g:
        g.write(raw)
    layer_digest, layer_size = blob(layout, gz.getvalue())
    diff_id = "sha256:" + hashlib.sha256(raw).hexdigest()

    labels = dict(kv.split("=", 1) for kv in args.label)
    config = {
        "architecture": "amd64", "os": "linux",
        "config": {"Labels": labels} if labels else {},
        "rootfs": {"type": "layers", "diff_ids": [diff_id]},
    }
    config_digest, config_size = blob(layout, json.dumps(config, sort_keys=True, separators=(",", ":")).encode())
    manifest = {
        "schemaVersion": 2,
        "mediaType": "application/vnd.oci.image.manifest.v1+json",
        "config": {"mediaType": "application/vnd.oci.image.config.v1+json", "digest": config_digest, "size": config_size},
        "layers": [{"mediaType": "application/vnd.oci.image.layer.v1.tar+gzip", "digest": layer_digest, "size": layer_size}],
    }
    manifest_digest, manifest_size = blob(layout, json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode())
    (layout / "oci-layout").write_text(json.dumps({"imageLayoutVersion": "1.0.0"}))
    (layout / "index.json").write_text(json.dumps({
        "schemaVersion": 2,
        "manifests": [{"mediaType": "application/vnd.oci.image.manifest.v1+json",
                       "digest": manifest_digest, "size": manifest_size}],
    }))
    print(f"{layout}: manifest {manifest_digest}, layer {layer_size / 1e6:.1f} MB gzip ({len(raw) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
