import { NextResponse } from 'next/server';

const API_BASE = 'https://leetcode-api-pied.vercel.app';

export async function GET() {
    try {
        const response = await fetch(`${API_BASE}/random`);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch random problem' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying random request:', error);
        return NextResponse.json(
            { error: 'Failed to fetch random problem' },
            { status: 500 }
        );
    }
}
