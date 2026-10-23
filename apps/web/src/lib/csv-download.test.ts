import { expect,it } from 'vitest';
import { csvContent } from './csv-download';
it('exports missing observations as empty and escapes formulas and quoted names',()=>{
 expect(csvContent([{name:'=1+1',value:null},{name:'"quoted"',value:42}])).toBe('"name","value"\r\n"\'=1+1",""\r\n"""quoted""","42"');
});
