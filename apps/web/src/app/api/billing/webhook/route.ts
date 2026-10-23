import { createHash } from 'node:crypto';
import { getProductPool,verifyBillingSignature,AccessError } from '@watchtower/database';
import { apiError,requestText } from '@/lib/server/http';
export async function POST(request:Request){try{
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)throw new AccessError(503,'Billing webhook not configured');
 if(Number(request.headers.get('content-length')??0)>65536)throw new AccessError(413,'Request too large');
 const body=await requestText(request);
 if(!verifyBillingSignature(body,request.headers.get('stripe-signature')??'',secret))throw new AccessError(400,'Invalid webhook signature');
 const event=JSON.parse(body) as {id:string;created:number;type:string;data:{object:{id:string;customer:string;status:string;current_period_end?:number;metadata?:{workspace_id?:string;plan?:string};items?:{data:{current_period_end?:number;quantity?:number;price:{id:string;unit_amount?:number;currency?:string;recurring?:{interval?:string;interval_count?:number}}}[]}}}};
 if(!['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type))return Response.json({received:true});
 const object=event.data.object,workspace=object.metadata?.workspace_id;
 const item=object.items?.data[0];const price=item?.price.id;const amount=['brl','usd','eur','gbp','cad','aud'].includes(item?.price.currency??'')?item?.price.unit_amount:undefined;const recurring=item?.price.recurring;const monthly=typeof amount==='number'&&recurring?.interval==='month'?amount/100*(item?.quantity??1)/(recurring.interval_count??1):typeof amount==='number'&&recurring?.interval==='year'?amount/1200*(item?.quantity??1)/(recurring.interval_count??1):null;
 const plan=price&&price===process.env.STRIPE_PRICE_TEAM?'team':price&&price===process.env.STRIPE_PRICE_SOLO?'solo':null;
 if(!workspace||!plan||typeof object.customer!=='string'||typeof object.id!=='string')throw new AccessError(400,'Unrecognized subscription configuration');
 await getProductPool().query('SELECT apply_billing_snapshot($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[event.id,createHash('sha256').update(body).digest('hex'),workspace,object.customer,object.id,plan,event.type==='customer.subscription.deleted'?'cancelled':object.status,(item?.current_period_end??object.current_period_end)?new Date((item?.current_period_end??object.current_period_end)!*1000):null,event.created,monthly,item?.price.currency??null]);return Response.json({received:true});
}catch(error){return apiError(error);}}
