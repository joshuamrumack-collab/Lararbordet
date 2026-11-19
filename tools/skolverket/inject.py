"""Lägger in catalog.json i dist/index.html (ersätter innehållet i <script id="catalog">)."""
import re,sys
cat=open("catalog.json",encoding="utf-8").read().replace("</","<\\/")
p="../../dist/index.html";s=open(p,encoding="utf-8").read()
s,n=re.subn(r'(<script type="application/json" id="catalog">).*?(</script>)',lambda m:m.group(1)+cat+m.group(2),s,count=1,flags=re.S)
assert n==1;open(p,"w",encoding="utf-8").write(s);print("katalog uppdaterad")
