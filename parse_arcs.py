import re, json, os

def parse(path, part):
    lines = open(path, encoding='utf-8').read().splitlines()
    arcs = []
    cur = None
    for line in lines:
        m = re.match(r'^\*\*([^*]+)\*\*$', line.strip())
        if m:
            name = m.group(1).strip()
            if name in ('Checked',):
                continue
            if name in ('Standalone side story', 'Standalone side stories', 'Battles recap special', 'Recap: Two Fates', 'Extra edition'):
                # still capture as side story
                pass
            cur = {'name': name, 'eps': []}
            arcs.append(cur)
            continue
        if cur is None:
            continue
        m = re.match(r'^(\d+)\s*\|\s*(\d+)\s*\|', line.strip())
        if m:
            cur['eps'].append(int(m.group(1)))
    out = []
    for a in arcs:
        if not a['eps']:
            continue
        out.append({'name': a['name'], 'from': min(a['eps']), 'to': max(a['eps'])})
    return out

p1 = parse(r'C:\Users\july2\.local\share\opencode\tool-output\tool_1622804c0001w3ukQ9ouG2IBIV', 1)
p2 = parse(r'C:\Users\july2\.local\share\opencode\tool-output\tool_1622805a1001C1ktpDfzH9JSgo', 2)
print('PART1')
for a in p1: print(a)
print('PART2')
for a in p2: print(a)
json.dump({'part1': p1, 'part2': p2}, open('arcs.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
