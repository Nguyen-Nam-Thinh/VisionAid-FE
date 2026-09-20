import { emptySnapshot, type Entity, type Snapshot } from '../../models/domain';
export function seed():Snapshot {
 const db=emptySnapshot();const ago=(minutes:number)=>new Date(Date.now()-minutes*60000).toISOString();
 db.people=[
 {id:'cg1',name:'Nguyễn Minh Anh',email:'caregiver@demo.vn',phone:'0901234567',role:'Caregiver',orgId:'',active:true},
 {id:'cg2',name:'Trần Quốc Bảo',email:'secondary@demo.vn',phone:'0912345678',role:'Caregiver',orgId:'',active:true},
 {id:'center',name:'Lê Thanh Hà',email:'center@demo.vn',phone:'0934567890',role:'CenterAdmin',orgId:'org1',active:true},
 {id:'admin',name:'Nguyễn Nam Thịnh',email:'admin@demo.vn',phone:'',role:'Admin',orgId:'',active:true},
 {id:'staff1',name:'Phạm Thu Trang',email:'staff@demo.vn',phone:'0987654321',role:'Caregiver',orgId:'org1',active:true},
 {id:'staff2',name:'Đỗ Hoàng Nam',email:'nam@demo.vn',phone:'0908888888',role:'Caregiver',orgId:'org1',active:true},
 {id:'viu1',name:'Nguyễn Văn An',email:'an@demo.vn',phone:'0902345678',role:'VisuallyImpaired',orgId:'',active:true},
 {id:'viu2',name:'Nguyễn Thị Lan',email:'lan@demo.vn',phone:'0903456789',role:'VisuallyImpaired',orgId:'',active:true},
 {id:'viu3',name:'Trần Minh Khang',email:'khang@demo.vn',phone:'0904567890',role:'VisuallyImpaired',orgId:'org1',active:true},
 {id:'viu4',name:'Lê Ngọc Mai',email:'mai@demo.vn',phone:'0905678901',role:'VisuallyImpaired',orgId:'org1',active:true},
 {id:'other',name:'Người dùng tổ chức khác',email:'other@demo.vn',phone:'',role:'VisuallyImpaired',orgId:'org2',active:true}];
 db.links=[{id:'l1',caregiverId:'cg1',viuId:'viu1',primary:true,alerts:true,registry:true,locations:true},{id:'l2',caregiverId:'cg1',viuId:'viu2',primary:true,alerts:true,registry:true,locations:true},{id:'l3',caregiverId:'cg2',viuId:'viu1',primary:false,alerts:true,registry:false,locations:false},{id:'l4',caregiverId:'staff1',viuId:'viu3',primary:true,alerts:true,registry:true,locations:true},{id:'l5',caregiverId:'staff2',viuId:'viu4',primary:true,alerts:true,registry:true,locations:true}];
 const entity=(id:string,name:string,fields:Entity['fields']={},extra:Partial<Entity>={}):Entity=>({id,name,fields,orgId:'',viuId:'',ownerId:'',active:true,version:1,...extra});
 db.entities.organizations=[entity('org1','Trung tâm Ánh Dương',{address:'Thủ Đức, TP. Hồ Chí Minh',phone:'02838221234',email:'hello@anhduong.demo',taxCode:'DEMO-001'}),entity('org2','Trung tâm Hy Vọng',{address:'Đà Nẵng',phone:'02363888888',email:'hello@hyvong.demo',taxCode:'DEMO-002'})];
 for(const [i,id] of ['viu1','viu2','viu3','viu4','other'].entries()){
  db.locations.push({viuId:id,lat:10.841+i*.002,lng:106.81+i*.003,at:ago(i===1?12:0),battery:i===1?18:82-i*10,accuracy:8+i,network:i===1?'Mất kết nối':'4G'});
  for(let k=0;k<12;k++)db.activities.push({id:'move'+i+'-'+k,viuId:id,type:'MOVEMENT',at:ago(k*5),text:'Vị trí ghi nhận trên tuyến demo',online:true,lat:10.841+i*.002+k*.0002,lng:106.81+i*.003+k*.0003});
  db.entities.places.push(entity('place'+i,'Nhà riêng',{lat:10.841+i*.002,lng:106.81+i*.003,radius:50,message:'Bạn đã về đến nhà'},{viuId:id}));
  db.entities.geofences.push(entity('zone'+i,'Khu vực an toàn',{lat:10.842+i*.002,lng:106.812+i*.003,radius:300,enter:false,exit:true},{viuId:id}));
  db.entities.contacts.push(entity('contact'+i,'Người thân',{type:'PHONE',phone:'0901234567',zalo:'',priority:1},{viuId:id}));
  db.entities.tts.push(entity('tts'+i,'Giọng đọc',{speed:1,voice:'Nữ',volume:80},{viuId:id}));
  db.entities.faces.push(entity('face'+i,'Người thân',{relationship:'Gia đình'},{viuId:id,active:false}));
  for(let j=0;j<8;j++)db.activities.push({id:`act${i}-${j}`,viuId:id,type:(['MOVEMENT','OCR','QR','FACE','VOICE'] as const)[j%5],at:ago(j*160+i*20),text:['Di chuyển quanh khu dân cư','Đã đọc: Cổng vào thư viện','QR văn bản: Thông tin điểm đến','Nhận diện người thân đã đăng ký','Lệnh: Đọc biển · xử lý offline'][j%5],online:j%5!==4});
 }
 db.alerts=['viu1','viu3','viu4'].map((id,i)=>({id:'alert'+i,viuId:id,type:i===1?'FALL':'SOS',status:i===2?'RESOLVED':'SENT',at:ago(7+i*20),version:1,lat:10.841+i*.002,lng:106.81+i*.003,history:[{at:ago(7+i*20),from:null,to:'SENT',actor:null},...(i===2?[{at:ago(30),from:'SENT' as const,to:'ACKNOWLEDGED' as const,actor:'staff2'},{at:ago(25),from:'ACKNOWLEDGED' as const,to:'RESOLVED' as const,actor:'staff2'}]:[])]}));
 db.entities.rules=[entity('rule1','Khẩn cấp SOS',{event:'SOS',push:true,email:true,mandatory:true}),entity('rule2','Ra khỏi vùng an toàn',{event:'GEOFENCE',push:true,email:false,mandatory:false}),entity('rule3','Pin yếu',{event:'BATTERY',push:true,email:false,mandatory:false})];
 db.entities.configs=[entity('config1','Thời gian chờ té ngã',{key:'fall_grace_seconds',value:15,min:5,max:60,unit:'giây'}),entity('config2','Ngưỡng confidence YOLO',{key:'yolo_confidence',value:.5,min:.1,max:1,unit:'0–1'}),entity('config3','Tốc độ TTS mặc định',{key:'tts_speed',value:1,min:.5,max:2,unit:'lần'})];
 for(let i=0;i<18;i++){db.deliveries.push({id:'delivery'+i,orgId:i%2?'org1':'',channel:i%2?'EMAIL':'PUSH',status:i%5===0?'FAILED':i%7===0?'PENDING':'SENT',event:i%2?'FALL':'SOS',at:ago(i*50)});db.audit.push({id:'audit'+i,actor:i%2?'center':'admin',orgId:i%2?'org1':'',at:ago(i*70),action:i%2?'Cập nhật phân công':'Cập nhật cấu hình',target:'Dữ liệu minh họa '+(i+1)});}
 for(let i=0;i<14;i++)for(const [j,model] of ['YOLOv8n','VietOCR','FaceNet'].entries())db.metrics.push({model,day:ago(i*1440).slice(0,10),latency:120+j*320+i*3,successes:92+j*2,total:100,confidence:.84+j*.03});
 return db;
}

