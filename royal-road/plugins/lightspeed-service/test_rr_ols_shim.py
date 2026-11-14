"""Unit tests for rr_ols_shim.py, with a stand-in for ols.src.auth.k8s.

Run: python3 -m unittest discover -s royal-road/plugins/lightspeed-service
"""

import types
import unittest
import uuid
from types import SimpleNamespace

import rr_ols_shim


def fake_k8s(uid):
    """A module shaped like ols.src.auth.k8s whose TokenReview returns `uid`."""
    module = types.ModuleType("k8s")

    class K8sClientSingleton:
        _cluster_id = None
        _cluster_version = None

    def get_user_info(token):
        if token == "invalid":
            return None
        return SimpleNamespace(user=SimpleNamespace(username=f"user-{token}", uid=uid, groups=["g"]))

    module.K8sClientSingleton = K8sClientSingleton
    module.get_user_info = get_user_info
    return module


class PatchTest(unittest.TestCase):
    def test_cluster_id_defaults_to_local(self):
        k8s = fake_k8s(uid="")
        rr_ols_shim.patch(k8s, {})
        self.assertEqual(k8s.K8sClientSingleton._cluster_id, "local")
        self.assertEqual(k8s.K8sClientSingleton._cluster_version, "unknown")

    def test_cluster_id_from_env(self):
        k8s = fake_k8s(uid="")
        rr_ols_shim.patch(k8s, {"RR_CLUSTER_ID": "abc", "RR_CLUSTER_VERSION": "v1.34"})
        self.assertEqual(k8s.K8sClientSingleton._cluster_id, "abc")
        self.assertEqual(k8s.K8sClientSingleton._cluster_version, "v1.34")

    def test_uid_unchanged_without_fallback(self):
        k8s = fake_k8s(uid="")
        rr_ols_shim.patch(k8s, {})
        self.assertEqual(k8s.get_user_info("alice").user.uid, "")

    def test_empty_uid_becomes_stable_uuid(self):
        k8s = fake_k8s(uid="")
        rr_ols_shim.patch(k8s, {"RR_UID_FALLBACK": "1"})
        first = k8s.get_user_info("alice").user.uid
        self.assertEqual(first, k8s.get_user_info("alice").user.uid)
        self.assertEqual(uuid.UUID(first).version, 5)
        self.assertNotEqual(first, k8s.get_user_info("bob").user.uid)
        self.assertEqual(first, str(uuid.uuid5(uuid.UUID(rr_ols_shim.DEFAULT_UID_NAMESPACE), "user-alice")))

    def test_existing_uid_is_kept(self):
        k8s = fake_k8s(uid="0b3f6c9e-0000-4000-8000-000000000001")
        rr_ols_shim.patch(k8s, {"RR_UID_FALLBACK": "1"})
        self.assertEqual(k8s.get_user_info("alice").user.uid, "0b3f6c9e-0000-4000-8000-000000000001")

    def test_invalid_token_still_returns_none(self):
        k8s = fake_k8s(uid="")
        rr_ols_shim.patch(k8s, {"RR_UID_FALLBACK": "1"})
        self.assertIsNone(k8s.get_user_info("invalid"))

    def test_missing_internals_fail_loudly(self):
        k8s = fake_k8s(uid="")
        del k8s.get_user_info
        with self.assertRaises(RuntimeError):
            rr_ols_shim.patch(k8s, {})
        k8s = fake_k8s(uid="")
        del k8s.K8sClientSingleton._cluster_id
        with self.assertRaises(RuntimeError):
            rr_ols_shim.patch(k8s, {})


if __name__ == "__main__":
    unittest.main()
