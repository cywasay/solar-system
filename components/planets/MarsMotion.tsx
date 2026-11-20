'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export default function MarsMotion({children,className}:{children:ReactNode;className:string}){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{const targets=root.current?.querySelectorAll<HTMLElement>('[data-mars-reveal]');if(!targets)return;const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).dataset.marsReveal='shown';observer.unobserve(entry.target);}}),{threshold:.55,rootMargin:'0px 0px -12% 0px'});targets.forEach(el=>observer.observe(el));return()=>observer.disconnect();},[]);
 return <main ref={root} className={className}>{children}</main>;
}
