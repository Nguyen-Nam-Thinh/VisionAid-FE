import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Fields } from '../models/domain';
export interface FieldSpec {key:string;label:string;type?:'text'|'email'|'password'|'number'|'checkbox'|'select'|'textarea'|'date';required?:boolean;min?:number;max?:number;options?:{value:string;label:string}[];disabled?:boolean;hint?:string;step?:number}
export function Form({fields,initial={},submit='Lưu thay đổi',onSubmit}:{fields:FieldSpec[];initial?:Fields;submit?:string;onSubmit:(values:Fields)=>Promise<unknown>}){
 const shape:Record<string,z.ZodType>={};for(const f of fields){if(f.type==='checkbox')shape[f.key]=z.boolean();else if(f.type==='number'){let n=z.number({error:'Cần nhập một số hợp lệ.'});if(f.min!==undefined)n=n.min(f.min,`Giá trị tối thiểu ${f.min}.`);if(f.max!==undefined)n=n.max(f.max,`Giá trị tối đa ${f.max}.`);shape[f.key]=n;}else{let s=z.string();if(f.required)s=s.min(f.type==='password'?8:f.key==='name'?2:1,f.type==='password'?'Mật khẩu cần ít nhất 8 ký tự.':'Vui lòng nhập thông tin.');if(f.max)s=s.max(f.max);shape[f.key]=f.type==='email'?s.email('Email không hợp lệ.'):s;}}
 const {register,handleSubmit,formState:{errors,isSubmitting},setError}=useForm<Fields>({resolver:zodResolver(z.object(shape)) as never,defaultValues:Object.fromEntries(fields.map(f=>[f.key,initial[f.key]??(f.type==='checkbox'?false:f.type==='number'?f.min??0:'')]))});
 const [failure,setFailure]=useState('');
 return <form className="stack" noValidate onSubmit={handleSubmit(async values=>{setFailure('');try{await onSubmit(values);}catch(e){const err=e as {message?:string;fields?:Record<string,string>};setFailure(err.message??'Không thể lưu thay đổi.');for(const [key,message] of Object.entries(err.fields??{}))setError(key,{message});}})}>
 {fields.map(f=><label className="field" key={f.key}>{f.label}{f.required?' *':''}{f.type==='select'?<select {...register(f.key)} disabled={f.disabled||isSubmitting} aria-invalid={!!errors[f.key]} aria-describedby={f.key+'-error'}><option value="">Chọn…</option>{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='textarea'?<textarea {...register(f.key)} disabled={f.disabled||isSubmitting} aria-describedby={f.key+'-error'} aria-invalid={!!errors[f.key]}/>:<input {...register(f.key,{valueAsNumber:f.type==='number'})} type={f.type??'text'} step={f.step??'any'} disabled={f.disabled||isSubmitting} autoComplete={f.type==='password'?'current-password':f.type==='email'?'email':'off'} aria-invalid={!!errors[f.key]} aria-describedby={f.key+'-error'}/>}<span id={f.key+'-error'} className="field-error">{errors[f.key]?.message as string}</span>{f.hint&&<small>{f.hint}</small>}</label>)}
 {failure&&<p className="notice error" role="alert">{failure}</p>}<button type="submit" className="btn primary" disabled={isSubmitting}>{isSubmitting?'Đang xử lý…':submit}</button>
 </form>;
}
