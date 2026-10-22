import json, os, re, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), 'assets', 'portraits')
os.makedirs(OUT, exist_ok=True)

chars = {
 'naruto': 'Naruto Uzumaki', 'sasuke': 'Sasuke Uchiha', 'sakura': 'Sakura Haruno',
 'kakashi': 'Kakashi Hatake', 'hinata': 'Hinata Hyuga', 'shikamaru': 'Shikamaru Nara',
 'rocklee': 'Rock Lee', 'gaara': 'Gaara', 'neji': 'Neji Hyuga', 'kiba': 'Kiba Inuzuka',
 'shino': 'Shino Aburame', 'ino': 'Ino Yamanaka', 'choji': 'Chōji Akimichi',
 'tenten': 'Tenten', 'temari': 'Temari', 'kankuro': 'Kankuro', 'sai': 'Sai',
 'yamato': 'Yamato', 'jiraiya': 'Jiraiya', 'tsunade': 'Tsunade', 'killerbee': 'Killer B',
 'minato': 'Minato Namikaze', 'itachi': 'Itachi Uchiha', 'kisame': 'Kisame Hoshigaki',
 'pain': 'Nagato', 'konan': 'Konan', 'deidara': 'Deidara', 'sasori': 'Sasori',
 'hidan': 'Hidan', 'kakuzu': 'Kakuzu', 'orochimaru': 'Orochimaru', 'madara': 'Madara Uchiha',
 'obito': 'Obito Uchiha', 'kaguya': 'Kaguya Ōtsutsuki', 'hiruzen': 'Hiruzen Sarutobi',
 'iruka': 'Iruka Umino', 'konohamaru': 'Konohamaru Sarutobi', 'shizune': 'Shizune',
 'guy': 'Might Guy', 'asuma': 'Asuma Sarutobi', 'kurenai': 'Kurenai Yūhi',
 'zabuza': 'Zabuza Momochi', 'haku': 'Haku', 'kushina': 'Kushina Uzumaki',
 'danzo': 'Danzō Shimura', 'tobirama': 'Tobirama Senju', 'hashirama': 'Hashirama Senju',
 'nagato': 'Nagato', 'kabuto': 'Kabuto Yakushi', 'shisui': 'Shisui Uchiha',
 'killerbee2': 'Killer B', 'mei': 'Mei Terumī', 'a4': 'A (Fourth Raikage)',
 'onoki': 'Ōnoki', 'sasuke2': 'Sasuke Uchiha',
}

# Known Part II filenames to try first
known = {
 'naruto': 'Naruto Part II.png', 'sasuke': 'Sasuke Part II.png', 'sakura': 'Sakura Part II.png',
 'kakashi': 'Kakashi Part II.png', 'hinata': 'Hinata Part II.png', 'gaara': 'Gaara Part II.png',
 'shikamaru': 'Shikamaru Part II.png', 'neji': 'Neji Part II.png', 'rocklee': 'Rock Lee Part II.png',
 'kiba': 'Kiba Part II.png', 'shino': 'Shino Part II.png', 'ino': 'Ino Part II.png',
 'choji': 'Choji Part II.png', 'tenten': 'Tenten Part II.png', 'temari': 'Temari Part II.png',
 'kankuro': 'Kankuro Part II.png', 'sai': 'Sai Part II.png', 'yamato': 'Yamato Part II.png',
 'jiraiya': 'Jiraiya Part II.png', 'tsunade': 'Tsunade Part II.png', 'itachi': 'Itachi Part II.png',
 'kisame': 'Kisame Part II.png', 'deidara': 'Deidara Part II.png', 'sasori': 'Sasori Part II.png',
 'hidan': 'Hidan Part II.png', 'kakuzu': 'Kakuzu Part II.png', 'orochimaru': 'Orochimaru Part II.png',
 'konan': 'Konan Part II.png', 'pain': 'Pain.png', 'killerbee': 'Killer Bee.png',
 'minato': 'Minato Namikaze.png', 'madara': 'Madara Uchiha.png', 'obito': 'Obito Uchiha.png',
 'kaguya': 'Kaguya Otsutsuki.png', 'iruka': 'Iruka Umino.png', 'hiruzen': 'Hiruzen Sarutobi.png',
 'kushina': 'Kushina Uzumaki.png', 'zabuza': 'Zabuza Momochi.png', 'haku': 'Haku.png',
 'guy': 'Might Guy Part II.png', 'kabuto': 'Kabuto Yakushi Part II.png',
}

API = 'https://naruto.fandom.com/api.php'
HDR = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Referer': 'https://naruto.fandom.com/', 'Accept': 'image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8'}

def get(url):
    req = urllib.request.Request(url, headers=HDR)
    return urllib.request.urlopen(req, timeout=40).read()

def api(params):
    params.update({'format': 'json'})
    url = API + '?' + urllib.parse.urlencode(params)
    return json.loads(get(url).decode('utf-8'))

def image_url(title, width=700):
    try:
        j = api({'action':'query','titles':'File:'+title,'prop':'imageinfo','iiprop':'url','iiurlwidth':str(width)})
        pages = j['query']['pages']
        for k,v in pages.items():
            if 'imageinfo' in v:
                return v['imageinfo'][0].get('thumburl') or v['imageinfo'][0]['url']
    except Exception as e:
        pass
    return None

def page_image(title, width=700):
    try:
        j = api({'action':'query','titles':title,'prop':'pageimages','pithumbsize':str(width)})
        for k,v in j['query']['pages'].items():
            if 'thumbnail' in v:
                return v['thumbnail']['source']
    except Exception:
        pass
    return None

manifest = {}
for key, name in chars.items():
    if key in manifest: continue
    url = None
    if key in known:
        url = image_url(known[key])
        if url: print('known', key, known[key])
    if not url:
        url = page_image(name)
        if url: print('page', key)
    if not url:
        print('MISSING', key, name)
        continue
    dest = os.path.join(OUT, key + '.png')
    try:
        data = get(url)
        with open(dest, 'wb') as f: f.write(data)
        manifest[key] = {'name': name, 'file': 'assets/portraits/' + key + '.png', 'bytes': len(data)}
        print('saved', key, len(data))
    except Exception as e:
        print('ERR', key, e)

with open(os.path.join(os.path.dirname(__file__), 'portrait-manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print('TOTAL', len(manifest))
