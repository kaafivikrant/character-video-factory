import {writeFileSync} from 'node:fs';import {stringify} from 'yaml';
const rows=[
[0,1,'my girlfriend found out','deadpan','flat','hold_phone'],
[1,4,'I still have a Chinese dating app on my phone','sad','down','hold_phone'],
[4,6,'and now she thinks I’m cheating','sad','rise_end','palm_out'],
[6,7,'I tried explaining that','deadpan','flat','shrug'],
[7,9,'I only use it to study the matchmaking algorithms','determined','flat','hand_to_chest'],
[9,11,'I’ve been creating fictional profiles','determined','lively','open_arms'],
[11,13,'for 60 year old businessman in Shanghai','deadpan','up','hold_phone'],
[13,15,'to see which personality rates','determined','flat','point'],
[15,16,'attracts the most attention','determined','fall_end','hand_to_chest'],
[16,17,'huh','surprised','rise_end','step_back'],
[17,18,'she asked why one of them was called','defensive','flat','palm_out'],
[18,20,'“handsome dragon 88”','embarrassed','up','hand_to_neck'],
[20,22,'brother that’s my highest performing account','defensive','up','hold_phone'],
[22,24,'I’m not deleting three months of research','determined','fall_end','hand_to_chest'],
[24,28,'you met me at a very Chinese time in my life','wistful','down','look_away']
];
const spec={id:'khan_30s',format:'vertical',fps:30,seed:27,scene:'misty_lake_bridge',music:null,characters:[{id:'hero',model:'builtin:atlas',voice:'${FISH_VOICE_HERO}',position:[0,0,0],facing:'camera',hoodie:'#52766b',pants:'#273b46'}],lines:rows.map(([start,end,text,emotion,pitch,gesture],i)=>({speaker:'hero',start,end,text,emotion,intensity:i===9?.85:.65,pitch,gesture,shot:i===14?'close':'auto',pause_after:0,tags:[]})),outro:{type:'card',text:'www.childrenofkhan.com',duration:2,background:'#f4f0e8'},captions:{style:'bold_white',max_words_per_chunk:5}};
writeFileSync('specs/khan_30s.yaml',stringify(spec));
