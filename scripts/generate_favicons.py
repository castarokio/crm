import os
from PIL import Image

source_image_path = r"C:\Users\elweh\.gemini\antigravity\brain\5bdb29ac-50fb-452e-8ec0-8a829600e4d8\favicon_base_1780356100254.png"
public_dir = r"C:\Users\elweh\Desktop\OS workflow\public"
app_dir = r"C:\Users\elweh\Desktop\OS workflow\src\app"

print(f"Reading source image from: {source_image_path}")
if not os.path.exists(source_image_path):
    print("Error: Source image not found!")
    exit(1)

# Open image and convert to RGBA
img = Image.open(source_image_path).convert("RGBA")

# Ensure output directories exist
os.makedirs(public_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)

# Generate PNGs
sizes = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "apple-touch-icon.png": (180, 180),
    "android-chrome-192x192.png": (192, 192),
    "android-chrome-512x512.png": (512, 512)
}

for name, size in sizes.items():
    resized_img = img.resize(size, Image.Resampling.LANCZOS)
    resized_img.save(os.path.join(public_dir, name))
    print(f"Saved: {name} ({size[0]}x{size[1]}) to public/")

# Generate favicon.ico containing both 16x16 and 32x32 sizes
icon_sizes = [(16, 16), (32, 32), (48, 48)]
icon_imgs = [img.resize(size, Image.Resampling.LANCZOS) for size in icon_sizes]

# Save to public/favicon.ico and src/app/favicon.ico
public_ico_path = os.path.join(public_dir, "favicon.ico")
app_ico_path = os.path.join(app_dir, "favicon.ico")

icon_imgs[0].save(
    public_ico_path,
    format="ICO",
    sizes=icon_sizes,
    append_images=icon_imgs[1:]
)
print(f"Saved: favicon.ico to public/")

icon_imgs[0].save(
    app_ico_path,
    format="ICO",
    sizes=icon_sizes,
    append_images=icon_imgs[1:]
)
print(f"Saved: favicon.ico to src/app/")

print("Favicon images generation complete!")
