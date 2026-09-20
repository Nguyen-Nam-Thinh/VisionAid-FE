import type { Command, Person, Snapshot } from '../models/domain';
export class ServiceError extends Error { constructor(message:string, public status=422, public fields:Record<string,string>={}) {super(message);} }
export interface VisionService {
 readonly mode:'mock'|'api';
 session():Promise<Person|null>;
 login(email:string,password:string):Promise<Person>;
 register(name:string,email:string,password:string):Promise<Person>;
 logout():Promise<void>;
 recover(email:string):Promise<string>;
 resetPassword(code:string,password:string):Promise<void>;
 changePassword(current:string,next:string):Promise<void>;
 profile(values:Pick<Person,'name'|'phone'|'avatar'>):Promise<Person>;
 snapshot(signal?:AbortSignal):Promise<Snapshot>;
 execute(command:Command):Promise<void>;
 resetDemo():Promise<void>;
 demoAccounts():Promise<Person[]>;
 addSecondary(viuId:string,email:string):Promise<void>;
 generateLink(viuId:string):Promise<string>;
 acceptLink(code:string):Promise<void>;
 resetAccountPassword(id:string):Promise<string>;
}

