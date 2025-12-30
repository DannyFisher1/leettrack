import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://leetcode-api-pied.vercel.app';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const response = await fetch(`${API_BASE}/problem/${slug}`);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Problem not found' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying problem request:', error);
        return NextResponse.json(
            { error: 'Failed to fetch problem' },
            { status: 500 }
        );
    }
}
