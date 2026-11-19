import json,glob,re,html
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__();s.areas=[];s.cur=None;s.buf=None;s.mode=None
    def area(s,name):
        s.cur=[name,[]];s.areas.append(s.cur)
    def handle_starttag(s,t,a):
        if t in('h3','h4','h5','p','li'): s.mode=t;s.buf=[]
        if t=='br' and s.buf is not None: s.buf.append(' ')
    def handle_data(s,d):
        if s.buf is not None: s.buf.append(d)
    def handle_endtag(s,t):
        if t!=s.mode or s.buf is None: return
        txt=re.sub(r'\s+',' ',''.join(s.buf).replace('\u00ad','')).strip();s.buf=None;s.mode=None
        if not txt: return
        if t=='h3': return  # årskursrubrik
        if t in('h4','h5','p'):
            if re.match(r'(Undervisningen|I undervisningen).{0,140}(behandla|centrala innehåll)',txt,re.I) or txt.lower().startswith('undervisningen'):
                if not s.cur or s.cur[1]: s.area('Centralt innehåll')
                return
            if t=='p' and len(txt)>140:  # löptext, inte rubrik
                return
            s.area(txt.rstrip(':'));return
        if t=='li':
            if not s.cur: s.area('Centralt innehåll')
            s.cur[1].append(txt)
def parse(h):
    p=P();p.feed(h or '');return [a for a in p.areas if a[1]]
def yname(y):
    y=(y or '').replace('-','–');return 'Åk '+y if y else 'Alla årskurser'
forms={k:{'id':k,'name':n,'subjects':[]} for k,n in [('GR','Grundskolan'),('GRAN','Anpassade grundskolan – ämnen'),('GRANO','Anpassade grundskolan – ämnesområden'),('GY','Gymnasieskolan – ämnen med nivåer'),('GYOLD','Gymnasieskolan – kurser (äldre ämnesplaner)')]}
nitems=0
for f in sorted(glob.glob('raw/*.json')):
    d=json.load(open(f))['subject'];st=set(d['schoolTypes']);typ=d['typeOfSyllabus'];code=d['code']
    if 'GR' in st: fid='GR'
    elif 'GRAN' in st: fid='GRANO' if typ=='SUBJECT_AREA_SYLLABUS' else 'GRAN'
    elif 'GY' in st: fid='GYOLD' if typ=='SUBJECT_SYLLABUS' else 'GY'
    else: continue
    plans=[]
    if d.get('centralContents'):
        for c in d['centralContents']:
            a=parse(c['text']);
            if a: plans.append({'id':code+'/'+(c.get('year') or 'x'),'name':yname(c.get('year')),'areas':a})
    for c in sorted(d.get('courses') or [],key=lambda c:int(c.get('sortOrder') or 0)):
        a=parse((c.get('centralContent') or {}).get('text'))
        if a:
            nm=c.get('name','');pts=c.get('points')
            plans.append({'id':code+'/'+c['code'],'name':nm+(f' ({pts} p)' if pts else ''),'areas':a})
    if not plans: continue
    for p in plans: nitems+=sum(len(a[1]) for a in p['areas'])
    forms[fid]['subjects'].append({'id':code,'name':d['name'],'plans':plans})
for f in forms.values(): f['subjects'].sort(key=lambda s:s['name'].lower())
cat={'source':'Skolverket, Syllabus API','fetched':'2026-11-19','forms':list(forms.values())}
s=json.dumps(cat,ensure_ascii=False,separators=(',',':'))
open('catalog.json','w').write(s)
print({f['id']:(len(f['subjects']),sum(len(x['plans']) for x in f['subjects'])) for f in forms.values()},'items',nitems,'size',round(len(s.encode())/1e6,2),'MB')
