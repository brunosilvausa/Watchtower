import { NextResponse,type NextRequest } from 'next/server';
import { resolveStatusDomain } from '@watchtower/database';
export async function proxy(request:NextRequest){
 const configured=process.env.BETTER_AUTH_URL;
 if(!configured)return NextResponse.next();
 let hostname:string;try{hostname=new URL(`http://${request.headers.get('host')??request.nextUrl.host}`).hostname;}catch{return new NextResponse('Invalid host',{status:400});}
 const canonical=new URL(configured).hostname;const loopback=['localhost','127.0.0.1','[::1]'];
 if(hostname===canonical||(loopback.includes(hostname)&&loopback.includes(canonical)))return NextResponse.next();
 try{const slug=await resolveStatusDomain(hostname);if(!slug)return new NextResponse('Not found',{status:404});const destination=request.nextUrl.clone();destination.pathname=`/status/${slug}`;return NextResponse.rewrite(destination);}catch{return new NextResponse('Status unavailable',{status:503});}
}
export const config={matcher:'/'};
