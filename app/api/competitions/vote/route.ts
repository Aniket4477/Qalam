import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'
import { getClientIdentifier } from '@/lib/getClientIdentifier'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(identifier, 'vote')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many vote requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to vote.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { competitionId, entryId, action = 'toggle' } = body

    if (!competitionId || !entryId) {
      return NextResponse.json(
        { error: 'Competition ID and Entry ID are required.' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = (await createAdminClient()) as any

    // 1. Verify competition status
    const { data: competition, error: compError } = await sb
      .from('competitions')
      .select('id, status, title')
      .eq('id', competitionId)
      .single()

    if (compError || !competition) {
      return NextResponse.json(
        { error: 'Competition not found.' },
        { status: 404 }
      )
    }

    if (competition.status === 'closed') {
      return NextResponse.json(
        { error: 'Voting is closed for this competition.' },
        { status: 400 }
      )
    }

    if (competition.status === 'upcoming') {
      return NextResponse.json(
        { error: 'This competition has not started yet.' },
        { status: 400 }
      )
    }

    // 2. Verify entry and verify author is not voting for own entry
    const { data: entry, error: entryError } = await sb
      .from('competition_entries')
      .select('id, competition_id, post_id, posts(author_id)')
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Competition entry not found.' },
        { status: 404 }
      )
    }

    const postAuthorId = entry.posts?.author_id
    if (postAuthorId && postAuthorId === user.id) {
      return NextResponse.json(
        { error: 'You cannot vote for your own entry.' },
        { status: 400 }
      )
    }

    // 3. Check current vote state
    const { data: existingVote, error: checkError } = await sb
      .from('competition_votes')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError && checkError.code === 'PGRST205') {
      return NextResponse.json(
        {
          error:
            'Competition votes table is being initialized. Please run migration 20260910_competition_votes.sql in your Supabase SQL editor.',
        },
        { status: 503 }
      )
    }

    let userHasVoted = false

    if (existingVote) {
      if (action === 'vote') {
        userHasVoted = true
      } else {
        // Toggle or unvote: remove vote
        const { error: deleteError } = await sb
          .from('competition_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) throw deleteError
        userHasVoted = false
      }
    } else {
      if (action === 'unvote') {
        userHasVoted = false
      } else {
        // Toggle or vote: insert vote
        const { error: insertError } = await sb
          .from('competition_votes')
          .insert({
            competition_id: competitionId,
            entry_id: entryId,
            user_id: user.id,
          })

        if (insertError) throw insertError
        userHasVoted = true
      }
    }

    // 4. Fetch updated vote count and recent voters
    const [{ count }, { data: votersData }] = await Promise.all([
      sb
        .from('competition_votes')
        .select('*', { count: 'exact', head: true })
        .eq('entry_id', entryId),
      sb
        .from('competition_votes')
        .select('created_at, profiles(id, username, display_name, avatar_url)')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const voters = (votersData ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.profiles)
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      userHasVoted,
      votesCount: count ?? 0,
      voters,
    })
  } catch (err: unknown) {
    console.error('Vote error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for GET requests too
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(identifier, 'api')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId query parameter is required.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = (await createAdminClient()) as any

    const [{ count }, { data: votersData }, { data: userVote }] = await Promise.all([
      sb
        .from('competition_votes')
        .select('*', { count: 'exact', head: true })
        .eq('entry_id', entryId),
      sb
        .from('competition_votes')
        .select('created_at, profiles(id, username, display_name, avatar_url)')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false })
        .limit(50),
      user
        ? sb
            .from('competition_votes')
            .select('id')
            .eq('entry_id', entryId)
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const voters = (votersData ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.profiles)
      .filter(Boolean)

    return NextResponse.json({
      votesCount: count ?? 0,
      userHasVoted: !!userVote,
      voters,
    })
  } catch (err: unknown) {
    console.error('Get votes error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
  }
}
