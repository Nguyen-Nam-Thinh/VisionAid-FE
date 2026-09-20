/** Client/demo models, NOT confirmed REST DTOs. Keep wire mappings in models/dto. */
export type Role = 'Caregiver' | 'CenterAdmin' | 'Admin' | 'VisuallyImpaired';
export type Value = string | number | boolean;
export type Fields = Record<string, Value>;
export interface Person { id: string; name: string; email: string; phone: string; role: Role; orgId: string; active: boolean; avatar?: string }
export interface Link { id: string; caregiverId: string; viuId: string; primary: boolean; alerts: boolean; registry: boolean; locations: boolean }
export type Kind = 'organizations' | 'faces' | 'places' | 'geofences' | 'contacts' | 'preferences' | 'tts' | 'rules' | 'configs';
export interface Entity { id: string; name: string; orgId: string; viuId: string; ownerId: string; active: boolean; fields: Fields; version: number }
export interface Photo { id: string; faceId: string; url: string; primary: boolean }
export type AlertStatus = 'DETECTED' | 'DISMISSED' | 'SENT' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED' | 'CALLED';
export interface Transition { at: string; from: AlertStatus | null; to: AlertStatus; actor: string | null }
export interface Alert { id: string; viuId: string; type: 'SOS' | 'FALL' | 'GEOFENCE'; status: AlertStatus; at: string; version: number; history: Transition[]; lat: number; lng: number }
export interface Location { viuId: string; lat: number; lng: number; at: string; battery: number | null; accuracy: number | null; network: string | null }
export interface Activity { id: string; viuId: string; type: 'MOVEMENT' | 'OCR' | 'QR' | 'FACE' | 'VOICE'; at: string; text: string; online: boolean; lat?:number; lng?:number }
export interface Audit { id: string; actor: string; orgId: string; at: string; action: string; target: string }
export interface ConfigRevision { id: string; configId: string; name: string; before: Value; after: Value; at: string; actor: string }
export interface Delivery { id: string; orgId: string; channel: 'PUSH' | 'EMAIL'; status: 'SENT' | 'FAILED' | 'PENDING'; event: string; at: string }
export interface Metric { model: string; day: string; latency: number; successes: number; total: number; confidence: number }
export interface Snapshot { people: Person[]; links: Link[]; entities: Record<Kind, Entity[]>; photos: Photo[]; alerts: Alert[]; locations: Location[]; activities: Activity[]; audit: Audit[]; revisions: ConfigRevision[]; deliveries: Delivery[]; metrics: Metric[] }
export type Command =
 | {type:'save'; kind:Kind; entity:Entity}
 | {type:'delete'; kind:Kind; id:string; version:number}
 | {type:'person'; person:Person}
 | {type:'link'; link:Link}
 | {type:'unlink'; id:string}
 | {type:'transfer'; viuId:string; caregiverId:string}
 | {type:'transition'; id:string; status:AlertStatus; version:number}
 | {type:'photo'; faceId:string; photo:Photo; remove?:boolean}
 | {type:'rollback'; revisionId:string}
 | {type:'simulate'; event:'tick'|'alert'|'stale'};
export const emptySnapshot = (): Snapshot => ({people:[],links:[],entities:{organizations:[],faces:[],places:[],geofences:[],contacts:[],preferences:[],tts:[],rules:[],configs:[]},photos:[],alerts:[],locations:[],activities:[],audit:[],revisions:[],deliveries:[],metrics:[]});


