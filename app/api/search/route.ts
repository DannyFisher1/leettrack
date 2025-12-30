import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://leetcode-api-pied.vercel.app';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Search failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying search request:', error);
        return NextResponse.json(
            { error: 'Failed to search' },
            { status: 500 }
        );
    }
}
