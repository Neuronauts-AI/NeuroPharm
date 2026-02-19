import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logsDir = path.join(process.cwd(), 'backend_logs');

        // Check if directory exists
        if (!fs.existsSync(logsDir)) {
            return NextResponse.json({ logs: [] });
        }

        // Read all JSON files
        const files = fs.readdirSync(logsDir)
            .filter(file => file.endsWith('.json') && file.includes('analyze'))
            .sort((a, b) => b.localeCompare(a)); // Sort newest first

        // Parse basic info from filenames
        const logs = files.map(filename => {
            const parts = filename.split('__');
            const timestamp = parts[0].replace(/_/g, ':').replace(/-/g, '/');
            const endpoint = parts[1] ? `/${parts[1].split('_')[0]}` : '/unknown';

            return {
                filename,
                timestamp,
                endpoint,
                method: 'POST' // Analyze endpoints are POST
            };
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error reading logs:', error);
        return NextResponse.json({ error: 'Failed to read logs', logs: [] }, { status: 500 });
    }
}
