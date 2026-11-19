import json,os,time,urllib.request,urllib.parse,concurrent.futures as cf
s=json.load(open('/tmp/all.json'))['subjects']
want=[x for x in s if set(x['schoolTypes'])&{'GR','GRAN','GY'}]
print(len(want))
def get(code):
    p=f'raw/{code}.json'
    if os.path.exists(p) and os.path.getsize(p)>500: return code,'cached'
    for a in range(4):
        try:
            with urllib.request.urlopen('https://api.skolverket.se/syllabus/v1/subjects/'+urllib.parse.quote(code),timeout=40) as r: data=r.read()
            open(p,'wb').write(data);return code,'ok'
        except Exception as e: time.sleep(2+a*3)
    return code,'FAIL'
with cf.ThreadPoolExecutor(4) as ex:
    res=list(ex.map(get,[x['code'] for x in want]))
print(sum(1 for r in res if r[1]!='FAIL'),'ok;',[r for r in res if r[1]=='FAIL'][:10])
json.dump(want,open('list.json','w'),ensure_ascii=False)
