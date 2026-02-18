import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const logsDir = path.join(process.cwd(), 'backend_logs');
        const filePath = path.join(logsDir, filename);

        // Security check - ensure file is within logs directory
        if (!filePath.startsWith(logsDir)) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Log file not found' }, { status: 404 });
        }

        // Read and parse log file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const logData = JSON.parse(fileContent);

        return NextResponse.json(logData);
    } catch (error) {
        console.error('Error reading log file:', error);
        return NextResponse.json({ error: 'Failed to read log file' }, { status: 500 });
    }
}
