import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
const size = 256;
const pixels = Buffer.alloc((size * 4 + 1) * size);
const lines = [
  [[58,96],[128,57],[198,96],[128,135],[58,96]],
  [[58,127],[128,166],[198,127]],
  [[58,158],[128,197],[198,158]],
];
function distance(x,y,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}
for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  const i=y*(size*4+1)+1+x*4;
  const corner=Math.hypot(Math.max(Math.abs(x-127.5)-76,0),Math.max(Math.abs(y-127.5)-76,0));
  const alpha=Math.max(0,Math.min(1,49.5-corner));
  let line=0;
  for(const points of lines) for(let j=1;j<points.length;j++) line=Math.max(line,Math.max(0,Math.min(1,5-distance(x,y,points[j-1],points[j]))));
  [66,99,216].forEach((c,j)=> {pixels[i+j]=Math.round(c+(255-c)*line);});
  pixels[i+3]=Math.round(alpha*255);
}
function crc32(buffer) {let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data) {const name=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([length,name,data,crc]);}
const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
await mkdir('resources',{recursive:true});await writeFile('resources/icon.png',png);await writeFile('resources/icon.ico',Buffer.concat([ico,png]));
console.log('Created AI Deck PNG and ICO.');
