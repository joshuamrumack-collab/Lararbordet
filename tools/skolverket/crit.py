import json,glob,re,html,collections
def paras(h):
    h=(h or '').replace('­','')
    h=re.sub(r'<h\d[^>]*>.*?</h\d>','',h,flags=re.S)
    ps=re.findall(r'<p[^>]*>(.*?)</p>',h,flags=re.S)
    out=[]
    for p in ps:
        p=re.sub(r'</?(strong|b)>','*',p);p=re.sub(r'<[^>]+>','',p);p=html.unescape(p);p=re.sub(r'\s+',' ',p).strip()
        p=re.sub(r'\*\s+\*',' ',p);p=re.sub(r'\*\*','',p).strip()  # två fetstilsord i rad: behåll mellanslaget
        if p and not re.match(r'^(Betyget [A-F]|Kriterier för|Betygskriterier för)',p): out.append(p)
    return out
def heading(h):
    m=re.search(r'<h\d[^>]*>(.*?)</h\d>',h or '',re.S);return re.sub(r'<[^>]+>','',m.group(1)).strip() if m else ''
def build(krs):
    """returns dict key-> {'E':[..],'C':[..],'A':[..]} or levels for no-step"""
    out={}
    by=collections.defaultdict(dict)
    for k in krs:
        st=k.get('gradeStep');yr=k.get('year') or '*'
        if st in ('E','C','A'): by[yr][st]=paras(k['text'])
        elif st is None:
            hd=heading(k['text']).lower()
            lv='G' if 'grundläggande' in hd else 'F' if 'fördjupade' in hd else 'E' if 'godtagbara' in hd else None
            if lv: by[yr][lv]=paras(k['text'])
    for yr,d in by.items():
        if d: out[yr]=d
    return out
if __name__!='__main__': raise SystemExit
res={};stats=collections.Counter();aligned=collections.Counter()
for f in glob.glob('raw/*.json'):
    d=json.load(open(f))['subject'];code=d['code']
    c=build(d.get('knowledgeRequirements') or [])
    if c: res[code]=c
    for co in d.get('courses') or []:
        cc=build(co.get('knowledgeRequirements') or [])
        if cc: res[code+'/'+co['code']]=cc
for k,v in res.items():
    for yr,d in v.items():
        ls=[len(x) for x in d.values()];aligned['eq' if len(set(ls))==1 else 'neq']+=1
json.dump(res,open('crit.json','w'),ensure_ascii=False,separators=(',',':'))
s=open('crit.json').read();print('crit size',round(len(s.encode())/1e6,2),'MB',aligned)
# per-form size
L={x['code']:x for x in json.load(open('list.json'))}
sz=collections.Counter()
for k,v in res.items():
    code=k.split('/')[0];x=L.get(code);st=set(x['schoolTypes']) if x else set()
    f='GR' if 'GR' in st else 'GRAN' if 'GRAN' in st else ('GYOLD' if x['typeOfSyllabus']=='SUBJECT_SYLLABUS' else 'GY')
    sz[f]+=len(json.dumps(v,ensure_ascii=False).encode())
print({k:round(v/1e6,2) for k,v in sz.items()})
print(json.dumps(res['GRGRSVE01']['9']['E'][:2],ensure_ascii=False)[:500]);print(len(res['GRGRSVE01']['9']['E']),len(res['GRGRSVE01']['9']['C']),len(res['GRGRSVE01']['9']['A']))
print(list(res['GRSAEST01'].keys()),{k:list(v.keys()) for k,v in res['GRSAEST01'].items()})
