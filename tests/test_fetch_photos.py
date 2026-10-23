"""Script delle foto: licenze ammesse e ritaglio."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fetch_photos", ROOT / "scripts" / "fetch_photos.py")
fp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fp)


def test_license_ok():
    for ok in ["CC0", "Public domain", "CC BY 4.0", "CC BY-SA 4.0", "CC BY 2.0", "CC BY-SA 3.0"]:
        assert fp.license_ok(ok), ok
    for bad in ["CC BY-NC 4.0", "CC BY-ND 4.0", "All rights reserved", "", "Fair use"]:
        assert not fp.license_ok(bad), bad


def test_crop_box():
    assert fp.crop_box((1000, 800), (0.1, 0.25, 0.9, 0.75)) == (100, 200, 900, 600)


def test_every_photo_has_title_and_alt():
    assert set(fp.PHOTOS) == {"modelli", "open", "business", "persone", "politica", "competenze", "notizie", "rapporti", "geopoliticai"}
    for pid, p in fp.PHOTOS.items():
        assert p["titolo"].startswith("File:"), pid
