#!/usr/bin/env python3
"""發布新版本：把版本號加 1，並在 version.json 最前面加一則給學生看的更新公告。

用法（在儲存庫根目錄執行）：
    python3 tools/release.py "公告標題" "第一點" "第二點" ...

會同時修改三個地方，三者一定要一致：
  1. js/29-update.js 的 APP_VERSION
  2. version.json 的 v 與 notes
  3. index.html 裡每個 js/、css/ 檔案後面的 ?v=（讓瀏覽器重新下載，不用舊快取）
改完後再 git commit、git push。
"""
import json, re, sys, datetime, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) < 3:
    sys.exit(__doc__)
title, items = sys.argv[1], sys.argv[2:]

upd = root / 'js' / '29-update.js'
s = upd.read_text(encoding='utf-8')
m = re.search(r'const APP_VERSION=(\d+)', s)
old = int(m.group(1)); new = old + 1
upd.write_text(s.replace(f'const APP_VERSION={old}', f'const APP_VERSION={new}', 1), encoding='utf-8')

vj = root / 'version.json'
d = json.loads(vj.read_text(encoding='utf-8'))
assert d['v'] == old, f'version.json 的 v（{d["v"]}）和 APP_VERSION（{old}）不一致'
d['v'] = new
d['notes'].insert(0, {'v': new, 'date': datetime.date.today().isoformat(), 'title': title, 'items': items})
vj.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

ix = root / 'index.html'
h = ix.read_text(encoding='utf-8')
h2, n = re.subn(r'(\.(?:js|css))\?v=\d+', rf'\1?v={new}', h)
ix.write_text(h2, encoding='utf-8')
print(f'版本 {old} → {new}（index.html 更新了 {n} 個 ?v=）')
