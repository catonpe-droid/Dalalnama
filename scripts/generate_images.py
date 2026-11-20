#!/usr/bin/env python3
"""Generate editorial 1200x630 PNG cover images for Dalalnama news.
Each image is a branded illustration, not an event photograph."""
import base64, io, json, os, re, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
site = root / 'site'
out = site / 'assets' / 'uploads'
out.mkdir(parents=True, exist_ok=True)
news = json.loads((root / 'data/news.json').read_text('utf8'))
html = (root / 'index.html').read_text('utf8')
m = re.search(r'<a class="brand"[^>]*>\s*<img src="data:image/webp;base64,([^"]+)"', html)
logo = Image.open(io.BytesIO(base64.b64decode(m.group(1)))) if m else None

font_paths = [
 '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf',
 '/usr/share/fonts/truetype/noto/NotoSansDevanagariUI-Bold.ttf',
 '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
]
font_file = next((p for p in font_paths if os.path.exists(p)), font_paths[-1])
def font(sz): return ImageFont.truetype(font_file,sz)

def fitlines(draw,text,max_width,max_lines=4):
 for size in range(56,31,-2):
  f=font(size); words=text.split(); lines=[]; line=''
  for word in words:
   candidate=(line+' '+word).strip()
   if line and draw.textbbox((0,0),candidate,font=f)[2]>max_width:
    lines.append(line);line=word
   else: line=candidate
  if line:lines.append(line)
  if len(lines)<=max_lines: return f,lines
 return font(32),lines[:max_lines]

palette=[
 ((22,39,59),(43,101,134)),((42,43,50),(153,54,44)),
 ((21,74,73),(45,139,112)),((57,36,75),(130,64,149)),
 ((71,48,22),(171,114,38)),((37,61,38),(111,143,54)),
 ((74,39,46),(171,67,70)),((35,50,76),(73,95,152))]
for i,entry in enumerate(news):
 if not entry.get('published',True): continue
 slug=str(entry['slug'])
 if not re.fullmatch(r'[a-z0-9_-]+',slug): continue
 W,H=1200,630; bg=Image.new('RGB',(W,H));d=ImageDraw.Draw(bg)
 low,high=palette[i%len(palette)]
 for y in range(H):
  t=y/max(1,H-1);color=tuple(round(low[j]*(1-t)+high[j]*t) for j in range(3))
  d.line((0,y,W,y),fill=color)
 d.ellipse((765,-190,1390,455),outline='#ffffff',width=3)
 d.ellipse((800,-152,1355,417),outline='#a7b5bf',width=3)
 d.rounded_rectangle((786,135,1145,472),radius=42,fill='#ffffff18')
 d.rectangle((0,0,W,13),fill='#d90c19')
 d.rectangle((0,13,W,20),fill='#ffca1c')
 category=str(entry.get('category','दलालनामा'))
 d.rounded_rectangle((50,46,360,100),radius=15,fill='#ffcb17')
 d.text((68,59),category,font=font(25),fill='#151515')
 f,lines=fitlines(d,str(entry.get('title','')),720)
 y=160
 for line in lines:
  d.text((53,y),line,font=f,fill='white',stroke_width=0)
  y+=f.size+17
 d.rectangle((0,520,W,630),fill='#151515')
 d.text((54,539),'दलालनामा  •  जनहित प्रथम',font=font(26),fill='#ffd225')
 d.text((54,583),'संपादकीय चित्र  |  मूळ बातमी वाचा',font=font(19),fill='#eeeeee')
 if logo:
  lg=logo.convert('RGBA')
  lg.thumbnail((325,106))
  plate=Image.new('RGBA',(lg.width+18,lg.height+18),'white')
  plate.alpha_composite(lg,(9,9))
  bg.paste(plate,(W-plate.width-40,32),plate)
 bg.save(out/(slug+'.png'), optimize=True)
print(f"Generated {len(list(out.glob('*.png')))} illustrated news covers")
if logo:
 lg=logo.convert('RGBA');lg.thumbnail((820,268))
 lg.save(site/'assets'/'logo.png')
# Shared main thumbnail
if news:
 (site/'assets'/'share.png').write_bytes((out/(news[0]['slug']+'.png')).read_bytes())
