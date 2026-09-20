import type { Location } from '../../models/domain';
export const isStale=(location:Location,now=Date.now())=>now-new Date(location.at).getTime()>120000;
export const coordinates=(location:Pick<Location,'lng'|'lat'>):[number,number]=>[location.lng,location.lat];
// Schematic projection only. This is not a road map or navigation system.
export function project(location:Location,all:Location[]){const lngs=all.map(l=>l.lng),lats=all.map(l=>l.lat);const minX=Math.min(...lngs)-.003,maxX=Math.max(...lngs)+.003,minY=Math.min(...lats)-.003,maxY=Math.max(...lats)+.003;return {left:`${15+70*(location.lng-minX)/(maxX-minX)}%`,top:`${15+60*(maxY-location.lat)/(maxY-minY)}%`};}
