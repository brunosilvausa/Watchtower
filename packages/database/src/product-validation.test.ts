import { expect,it,vi,afterEach } from 'vitest';
import { monitorSchema,maintenanceSchema,invitationSchema,csvCell,planLimits } from './product-validation.js';
import { encryptSecret,decryptSecret,hashPagePassword,verifyPagePassword,tokenHash,newToken } from './product-secrets.js';
afterEach(()=>vi.unstubAllEnvs());
it('rejects unsafe and incomplete monitor configuration',()=>{
 expect(monitorSchema.safeParse({name:'test',type:'http',target:'https://user:password@example.com'}).success).toBe(false);
 for(const type of ['keyword','port','api'])expect(monitorSchema.safeParse({name:'test',type,target:'https://example.com'}).success).toBe(false);
 expect(monitorSchema.parse({name:'test',type:'http',target:'https://example.com'}).intervalSeconds).toBe(300);
});
it('rejects reversed maintenance and invalid timezones',()=>{
 expect(maintenanceSchema.safeParse({name:'test',startsAt:'2026-10-22T10:00:00Z',endsAt:'2026-10-22T09:00:00Z'}).success).toBe(false);
 expect(maintenanceSchema.safeParse({name:'test',startsAt:'2026-10-22T10:00:00Z',endsAt:'2026-10-22T11:00:00Z',timezone:'Mars/Olympus'}).success).toBe(false);
});
it('normalizes invites, rejects owner escalation and escapes spreadsheet formulas',()=>{
 expect(invitationSchema.parse({email:'Name@Example.com',role:'viewer'}).email).toBe('name@example.com');
 expect(invitationSchema.safeParse({email:'a@b.com',role:'owner'}).success).toBe(false);
 expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');expect(planLimits('unknown').monitors).toBe(10);
});
it('authenticates encrypted credentials and hashes one-time tokens',()=>{
 vi.stubEnv('PRODUCT_ENCRYPTION_KEY','a'.repeat(64));const sealed=encryptSecret({token:'private'});expect(sealed).not.toContain('private');expect(decryptSecret(sealed)).toEqual({token:'private'});
 vi.stubEnv('PRODUCT_ENCRYPTION_KEY','b'.repeat(64));expect(()=>decryptSecret(sealed)).toThrow();expect(tokenHash(newToken())).toHaveLength(64);
});
it('verifies status-page passwords with salted hashes',async()=>{const hash=await hashPagePassword('correct horse');expect(await verifyPagePassword('correct horse',hash)).toBe(true);expect(await verifyPagePassword('wrong',hash)).toBe(false);});
it('bounds API flows and allows structured extraction without executable code',()=>{expect(monitorSchema.safeParse({name:'API',type:'api',target:'https://example.com',config:{steps:[{url:'https://example.com',method:'POST',body:'{}',extract:[{name:'token',path:'token'}]}]}}).success).toBe(true);expect(monitorSchema.safeParse({name:'API',type:'api',target:'https://example.com',config:{steps:[{url:'https://example.com',method:'TRACE'}]}}).success).toBe(false);});
