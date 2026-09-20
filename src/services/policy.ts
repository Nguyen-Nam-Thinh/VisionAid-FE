import type { AlertStatus, Entity, Kind, Person, Snapshot } from '../models/domain';
export function canSeeViu(db:Snapshot,user:Person,id:string):boolean {
 const viu=db.people.find(p=>p.id===id&&p.role==='VisuallyImpaired'&&p.active);
 if(!user.active||!viu)return false;
 if(user.role==='CenterAdmin')return !!user.orgId&&viu.orgId===user.orgId;
 return user.role==='Caregiver'&&viu.orgId===user.orgId&&db.links.some(l=>l.viuId===id&&l.caregiverId===user.id);
}
export function linkPermission(db:Snapshot,user:Person,id:string,flag:'primary'|'alerts'|'registry'|'locations'):boolean {return canSeeViu(db,user,id)&&db.links.some(l=>l.caregiverId===user.id&&l.viuId===id&&l[flag]);}
export function canWrite(db:Snapshot,user:Person,kind:Kind,e:Entity):boolean {
 if(!user.active)return false;
 if(kind==='organizations')return user.role==='Admin'||(user.role==='CenterAdmin'&&e.id===user.orgId);
 if(kind==='configs')return user.role==='Admin';
 if(kind==='rules')return user.role==='Admin'?e.orgId==='':user.role==='CenterAdmin'&&!!user.orgId&&e.orgId===user.orgId;
 if(kind==='preferences')return user.role==='Caregiver'&&e.ownerId===user.id;
 const flag=kind==='faces'?'registry':kind==='places'||kind==='geofences'?'locations':'primary';
 return user.role==='Caregiver'&&linkPermission(db,user,e.viuId,flag);
}
export function canRead(db:Snapshot,user:Person,kind:Kind,e:Entity):boolean {
 if(kind==='organizations')return user.role==='Admin'||(!!user.orgId&&e.id===user.orgId);
 if(kind==='rules')return e.orgId===''||e.orgId===user.orgId;
 if(kind==='configs')return user.role==='Admin';
 if(kind==='preferences')return e.ownerId===user.id;
 if(kind==='faces')return linkPermission(db,user,e.viuId,'registry');
 return canSeeViu(db,user,e.viuId);
}
export function canManagePerson(actor:Person,target:Person):boolean {
 if(actor.role==='Admin')return actor.id!==target.id;
 return actor.role==='CenterAdmin'&&!!actor.orgId&&target.orgId===actor.orgId&&['Caregiver','VisuallyImpaired'].includes(target.role);
}
export const nextStates:Record<AlertStatus,AlertStatus[]>={DETECTED:[],DISMISSED:[],SENT:['ACKNOWLEDGED','ESCALATED'],ACKNOWLEDGED:['ESCALATED','RESOLVED'],ESCALATED:['RESOLVED'],RESOLVED:[],CALLED:[]};
export function scopeSnapshot(db:Snapshot,user:Person):Snapshot {
 const visible=(id:string)=>canSeeViu(db,user,id);
 const entities={...db.entities};
 for(const kind of Object.keys(entities) as Kind[])entities[kind]=entities[kind].filter(e=>canRead(db,user,kind,e));
 const linkedIds=new Set(db.links.filter(l=>visible(l.viuId)).map(l=>l.caregiverId));
 const people=db.people.filter(p=>p.id===user.id||user.role==='Admin'||(user.role==='CenterAdmin'&&p.orgId===user.orgId)||visible(p.id)||linkedIds.has(p.id));
 return {...db,people,entities,links:db.links.filter(l=>user.role==='Admin'||visible(l.viuId)),photos:db.photos.filter(p=>entities.faces.some(f=>f.id===p.faceId)),alerts:db.alerts.filter(a=>user.role==='CenterAdmin'?visible(a.viuId):linkPermission(db,user,a.viuId,'alerts')),locations:db.locations.filter(l=>visible(l.viuId)),activities:db.activities.filter(a=>visible(a.viuId)),audit:user.role==='Admin'?db.audit:[],revisions:user.role==='Admin'?db.revisions:[],deliveries:user.role==='Admin'?db.deliveries:[],metrics:user.role==='Admin'?db.metrics:[]};
}
