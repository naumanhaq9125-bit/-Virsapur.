from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets"
OUTPUT = SOURCE / "optimized"
OUTPUT.mkdir(parents=True, exist_ok=True)

for path in sorted(SOURCE.rglob("*")):
    if OUTPUT in path.parents or not path.is_file() or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    with Image.open(path) as source:
        image = source.convert("RGBA") if "A" in source.getbands() else source.convert("RGB")
        stem = path.stem.replace("_", "-")
        for width in sorted({min(image.width, 640), min(image.width, 1280)}):
            height = round(image.height * width / image.width)
            resized = image if width == image.width else image.resize((width, height), Image.Resampling.LANCZOS)
            resized.save(OUTPUT / f"{stem}-{width}.webp", "WEBP", quality=82, method=6)
            print(f"{path.name}: {width}x{height}")
