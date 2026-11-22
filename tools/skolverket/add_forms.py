"""Lägger till eller uppdaterar en skolform i den befintliga katalogen utan att röra övriga ämnen.
Används så här (efter att raw/ fyllts med ämnen för skolformen):  python3 add_forms.py GYAN
Ämnenas och det centrala innehållets id:n ändras inte för andra skolformer."""
import json,glob,gzip,sys
def defs(path):
    src=open(path).read().split("if __name__!='__main__'")[0];g={};exec(src,g);return g
B=defs('build.py');C=defs('crit.py')
want=set(sys.argv[1:]) or {'GYAN'}
cat=json.load(gzip.open('../../data/catalog.json.gz'));crit=json.load(gzip.open('../../data/crit.json.gz'))
names=dict(B['FORMS']);new={}
for f in sorted(glob.glob('raw/*.json')):
    d=json.load(open(f))['subject'];st=set(d['schoolTypes'])
    if not (st&want): continue
    fid=B['form_of'](st,d['typeOfSyllabus'])
    if not fid: continue
    plans=B['plans_of'](d)
    if not plans: continue
    new.setdefault(fid,[]).append({'id':d['code'],'name':d['name'],'plans':plans})
    k=C['build'](d.get('knowledgeRequirements') or [])
    if k: crit[d['code']]=k
    for co in d.get('courses') or []:
        kk=C['build'](co.get('knowledgeRequirements') or [])
        if kk: crit[d['code']+'/'+co['code']]=kk
ids=[x[0] for x in B['FORMS']]
forms={f['id']:f for f in cat['forms']}
for fid,subs in new.items():
    subs.sort(key=lambda s:s['name'].lower());forms[fid]={'id':fid,'name':names[fid],'subjects':subs}
cat['forms']=[forms[i] for i in ids if i in forms]
json.dump(cat,gzip.open('../../data/catalog.json.gz','wt',compresslevel=9),ensure_ascii=False,separators=(',',':'))
json.dump(crit,gzip.open('../../data/crit.json.gz','wt',compresslevel=9),ensure_ascii=False,separators=(',',':'))
print({k:(len(v),sum(len(s['plans']) for s in v)) for k,v in new.items()})
