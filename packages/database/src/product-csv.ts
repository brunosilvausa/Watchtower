import { AccessError } from './product.js';
export function parseMonitorCsv(text: string): {
    name: string;
    type: 'http';
    target: string;
    intervalSeconds: number;
    config: Record<string, never>;
}[] {
    if (text.length > 60000)
        throw new AccessError(413, 'CSV too large');
    const rows: string[][] = [];
    let row: string[] = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;
        if (ch === '"') {
            if (quoted && text[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (!quoted && cell.length)
                throw new AccessError(400, 'Invalid CSV quote');
            else
                quoted = !quoted;
        }
        else if (ch === ',' && !quoted) {
            row.push(cell);
            cell = '';
        }
        else if ((ch === '\n' || ch === '\r') && !quoted) {
            if (ch === '\r' && text[i + 1] === '\n')
                i++;
            row.push(cell);
            if (row.some(Boolean))
                rows.push(row);
            row = [];
            cell = '';
        }
        else
            cell += ch;
    }
    if (quoted)
        throw new AccessError(400, 'Unclosed CSV quote');
    row.push(cell);
    if (row.some(Boolean))
        rows.push(row);
    const headers = rows.shift()?.map(x => x.trim().toLowerCase());
    if (!headers || headers.join(',') !== 'name,url,interval')
        throw new AccessError(400, 'CSV header must be name,url,interval');
    if (!rows.length || rows.length > 200)
        throw new AccessError(400, 'Import between 1 and 200 monitors');
    return rows.map(values => { if (values.length !== 3)
        throw new AccessError(400, 'Each CSV row needs three columns'); return { name: values[0]!, type: 'http', target: values[1]!, intervalSeconds: Number(values[2]), config: {} }; });
}
