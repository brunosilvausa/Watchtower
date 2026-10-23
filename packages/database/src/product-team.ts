import type pg from 'pg';
import { AccessError, type Actor } from './product.js';
import { audit, found, workspacePlan, type ProductRequest } from './product-common.js';
import { invitationSchema, planLimits } from './product-validation.js';
import { newToken, tokenHash, encryptSecret } from './product-secrets.js';
export async function teamRequest(client: pg.PoolClient, actor: Actor, workspaceId: string, request: ProductRequest): Promise<unknown> {
    const id = request.path[1];
    if (request.path[0] === 'invitations') {
        if (request.method === 'GET')
            return (await client.query('SELECT id,email,role,expires_at,accepted_at,cancelled_at,created_at FROM invitations WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 100', [workspaceId])).rows;
        if (request.method === 'DELETE' && id) {
            found((await client.query('UPDATE invitations SET cancelled_at=now() WHERE workspace_id=$1 AND id=$2 AND accepted_at IS NULL RETURNING id', [workspaceId, id])).rows[0]);
            await client.query("UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE workspace_id=$1 AND event='invitation' AND payload->>'invitationId'=$2 AND state IN ('pending','retry')",[workspaceId,id]);
            await audit(client, actor, workspaceId, 'cancel', 'invitation', id);
            return { id };
        }
        if(id&&request.path[2]==='resend'&&request.method==='POST'){
            const token=newToken('invite_');const row=found((await client.query("UPDATE invitations SET token_hash=$3,expires_at=now()+interval '7 days' WHERE workspace_id=$1 AND id=$2 AND accepted_at IS NULL AND cancelled_at IS NULL RETURNING id,email,expires_at",[workspaceId,id,tokenHash(token)])).rows[0]);
            await queueInvitation(client,workspaceId,row.id,row.email,token);await audit(client,actor,workspaceId,'resend','invitation',id);return {...row,token,delivery:'queued'};
        }
        const input = invitationSchema.parse(request.body), limit = planLimits(await workspacePlan(client, workspaceId)).seats;
        const seats = (await client.query("SELECT (SELECT count(*) FROM memberships WHERE workspace_id=$1)+(SELECT count(*) FROM invitations WHERE workspace_id=$1 AND accepted_at IS NULL AND cancelled_at IS NULL AND expires_at>now()) AS total", [workspaceId])).rows[0];
        if (Number(seats.total) >= limit)
            throw new AccessError(409, 'Workspace seat limit reached');
        const token = newToken('invite_');
        const row = (await client.query("INSERT INTO invitations(workspace_id,email,role,token_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days') RETURNING id,expires_at", [workspaceId, input.email, input.role, tokenHash(token)])).rows[0];
        await audit(client, actor, workspaceId, 'create', 'invitation', row.id);
        await queueInvitation(client,workspaceId,row.id,input.email,token);return { ...row, token, delivery: 'queued' };
    }
    if (request.method === 'GET')
        return (await client.query('SELECT m.user_id,m.role,m.created_at,u.name,u.email FROM memberships m JOIN auth_user u ON u.id=m.user_id WHERE workspace_id=$1 ORDER BY m.created_at', [workspaceId])).rows;
    if (!id)
        throw new AccessError(400, 'Member required');
    const current = found((await client.query('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 FOR UPDATE', [workspaceId, id])).rows[0]);
    const actorRole = found((await client.query('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2', [workspaceId, actor.userId])).rows[0]).role;
    const role = (request.body as {
        role?: string;
    })?.role;
    if (request.method !== 'DELETE' && !['owner', 'admin', 'editor', 'viewer'].includes(role ?? ''))
        throw new AccessError(400, 'Invalid role');
    if ((current.role === 'owner' || role === 'owner') && actorRole !== 'owner')
        throw new AccessError(403, 'Only owners can change ownership');
    if (current.role === 'owner' && (request.method === 'DELETE' || role !== 'owner')) {
        const count = (await client.query("SELECT count(*)::int AS count FROM memberships WHERE workspace_id=$1 AND role='owner'", [workspaceId])).rows[0].count;
        if (count <= 1)
            throw new AccessError(409, 'Cannot remove the last owner');
    }
    if (request.method === 'DELETE')
        await client.query('DELETE FROM memberships WHERE workspace_id=$1 AND user_id=$2', [workspaceId, id]);
    else
        await client.query('UPDATE memberships SET role=$3 WHERE workspace_id=$1 AND user_id=$2', [workspaceId, id, role]);
    await audit(client, actor, workspaceId, request.method === 'DELETE' ? 'remove' : 'role-change', 'member', id);
    return { id };
}

async function queueInvitation(client:pg.PoolClient,workspaceId:string,id:string,email:string,token:string):Promise<void>{
 const origin=process.env.BETTER_AUTH_URL;if(!origin)throw new AccessError(503,'Application URL is not configured');const link=new URL('/invite',origin);link.searchParams.set('token',token);
 await client.query("UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE workspace_id=$1 AND event='invitation' AND payload->>'invitationId'=$2 AND state IN ('pending','retry')",[workspaceId,id]);
 await client.query("INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES($1,'invitation',$2,$3)",[workspaceId,JSON.stringify({invitationId:id,destination:email,subject:'Watchtower workspace invitation',encryptedMessage:encryptSecret({message:`You have been invited to a Watchtower workspace. Accept within seven days: ${link.toString()}`})}),`invite:${id}:${tokenHash(token)}`]);
}
