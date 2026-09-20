import { runtime } from '../configs/runtime';
import { apiService } from './api/adapter';
import { createMockService } from './mocks/service';
export const service=runtime.mode==='api'?apiService:createMockService(typeof localStorage==='undefined'?undefined:{read:()=>localStorage.getItem('visionaid.demo.v1'),write:value=>localStorage.setItem('visionaid.demo.v1',value)});
