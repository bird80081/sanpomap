const test = require('node:test'), assert = require('node:assert/strict'), m = require('../maps.js');
test('only trusted HTTPS Maps links can open directly',()=>{
 for(const url of ['javascript:alert(1)','https://google.com.evil.test/maps/place/x','https://www.google.com/url?q=x','https://user@www.google.com/maps/x','http://maps.app.goo.gl/x']) assert.equal(m.safeUrl(url),'');
 assert.ok(m.safeUrl('https://maps.app.goo.gl/Abc123'));
});
test('short links need a separate route location',()=>{
 assert.throws(()=>m.fields('','https://maps.app.goo.gl/Abc','午餐'),/完整地址/);
 const f=m.fields('高雄市中山路1號','https://maps.app.goo.gl/Abc','午餐');
 assert.equal(m.resolve(f).url,'https://maps.app.goo.gl/Abc');
 assert.equal(new URL(m.directions([{q:'車站'},f])).searchParams.get('destination'),'高雄市中山路1號');
});
test('selected pin beats viewport center; viewport alone is never a pin',()=>{
 assert.equal(m.parse('https://www.google.com/maps/place/Test/@22,120,15z/data=!3d25.0478!4d121.517').query,'25.0478,121.517');
 assert.equal(m.parse('https://www.google.com/maps/@22,120,15z').query,'');
});
test('place IDs survive search and directions',()=>{
 const url='https://www.google.com/maps/search/?api=1&query=Store&query_place_id=ChIJtest123';
 const f=m.fields('',url,'午餐');
 assert.equal(m.resolve(f).url,url);
 assert.equal(new URL(m.directions([{q:'A'},f])).searchParams.get('destination_place_id'),'ChIJtest123');
});
test('URL pasted into address is normalized; unsafe or route URLs are rejected',()=>{
 assert.equal(m.fields('https://www.google.com/maps?q=25,121','','店').q,'25,121');
 assert.throws(()=>m.fields('javascript:alert(1)','','店'));
 assert.throws(()=>m.fields('','https://www.google.com/maps/dir/?api=1&destination=Taipei','店'));
 assert.throws(()=>m.fields('91,121','','店'));
});
test('all stops remain in mobile-safe overlapping route segments',()=>{
 const stops=Array.from({length:14},(_,i)=>({title:'站'+i,q:'地址'+i}));
 const parts=m.segments(stops,'driving');
 assert.ok(parts.every(p=>p.items.length<=5));
 assert.deepEqual(parts.flatMap((p,i)=>i?p.items.slice(1):p.items),stops);
 assert.equal(m.segments(stops,'transit').length,13);
 assert.deepEqual(m.segments([{q:'a',inDayRoute:false},{q:'b'}],'driving')[0].items,[{q:'b'}]);
});
test('mixed waypoint IDs become endpoints without dropping any stops',()=>{
 const stops=[{q:'a'},{q:'b',mapUrl:'https://www.google.com/maps/search/?query=b&query_place_id=ChIJtest123'},{q:'c'},{q:'d'},{q:'e'}];
 const p=m.segments(stops,'driving');
 assert.equal(new URL(p[0].url).searchParams.get('destination_place_id'),'ChIJtest123');
 assert.deepEqual(p.flatMap((x,i)=>i?x.items.slice(1):x.items),stops);
});
test('removing a saved link restores plain-text mapping and legacy rows work',()=>{
 assert.equal(m.fields('新地址','','新名稱').mapUrl,'');
 assert.match(m.resolve({q:'臺北車站'}).url,/query=/);
 assert.equal(m.segments([],'driving').length,0);
});
