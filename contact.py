from PIL import Image, ImageDraw
import os, glob
files = sorted(glob.glob('assets/portraits/*.png'))
cols = 8
tw, th = 150, 195
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (18, 18, 22))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    try:
        im = Image.open(f).convert('RGBA')
        im.thumbnail((tw - 12, th - 32))
        x = (i % cols) * tw + (tw - im.width) // 2
        y = (i // cols) * th + 6
        sheet.paste(im, (x, y), im)
        d.text(((i % cols) * tw + 6, (i // cols) * th + th - 20), os.path.basename(f)[:-4], fill=(255, 220, 120))
    except Exception as e:
        print(f, e)
sheet.save(r'C:\Users\july2\AppData\Local\Temp\opencode\contact.png')
print(len(files), sheet.size)
