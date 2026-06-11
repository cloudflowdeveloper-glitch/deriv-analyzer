import { NextResponse } from 'next/server'

// GET /api/analysis - Analyze a specific market
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketType = searchParams.get('marketType') || 'all'
  const signal = searchParams.get('signal') || 'all'

  // Simulated analysis based on market type
  const analyses: Record<string, {
    insights: string[]
    recommendations: string[]
    riskLevel: string
    winRate: number
    avgROI: number
    marketEfficiency: number
  }> = {
    even_odd: {
      insights: [
        'Even totals occurred 52.3% in the last 100 matches across all leagues',
        'Premier League shows slight odd bias (54.1%) in the last 30 days',
        'La Liga even/odd distribution is near 50/50 ideal',
        'High-scoring games (>3.5 goals) tend toward even totals'
      ],
      recommendations: [
        'Consider value on Even when total goals line is 2.5',
        'Odd is slightly undervalued in Premier League markets',
        'Wait for live momentum shifts before placing turbo even/odd bets'
      ],
      riskLevel: 'Low',
      winRate: 51.2,
      avgROI: 3.8,
      marketEfficiency: 94.2
    },
    differs: {
      insights: [
        'Differs 0-0 has highest hit rate at 89.4% across all leagues',
        '1-1 differs market settled favorably 76.8% of the time',
        'Risk increases significantly for low-frequency scorelines',
        'Bundesliga differs markets show highest success rate (84.2%)'
      ],
      recommendations: [
        'Stack 0-0 differs with over 1.5 for balanced exposure',
        'Avoid differs markets on derby matches - more unpredictable',
        '2-0 and 0-2 differs offer good value in top-tier leagues'
      ],
      riskLevel: 'Low-Medium',
      winRate: 78.5,
      avgROI: 5.2,
      marketEfficiency: 91.7
    },
    over_under: {
      insights: [
        'Over 2.5 hit rate is 58.4% in live markets after 60th minute',
        'Under 2.5 pre-match value highest in Serie A (62.1%)',
        'Goal expectancy models favor Over 3.5 in Bundesliga matches',
        'Under 1.5 settled correctly 72.3% in last 200 matches'
      ],
      recommendations: [
        'Over 2.5 is value in matches with high xG (>2.8)',
        'Under markets stronger in defensive matchups',
        'Live over/under after 70th minute shows highest edge',
        'Consider under 0.5 HT as hedge in accumulator strategies'
      ],
      riskLevel: 'Medium',
      winRate: 56.8,
      avgROI: 4.5,
      marketEfficiency: 88.9
    },
    multiplier: {
      insights: [
        'x2 multiplier hit rate 34.2% - highest among multiplier markets',
        'x10 and x20 multipliers show high variance but positive EV',
        'Kelly criterion suggests 2-5% stake for x3-x5 multipliers',
        'x20 multiplier historically profitable in 3/14 market conditions'
      ],
      recommendations: [
        'Use x2-x5 multipliers for steady bankroll growth',
        'Reserve x10-x20 for special market conditions only',
        'Combine with strong signal markets for best multiplier results',
        'Set stop-loss at 3 consecutive multiplier misses'
      ],
      riskLevel: 'High',
      winRate: 28.4,
      avgROI: 12.6,
      marketEfficiency: 76.3
    },
    higher_lower: {
      insights: [
        'Higher than 2.5 correct 61.2% in matches with attacking teams',
        'Lower markets outperform in congested fixture periods',
        'Higher/lower divergence signals strong market inefficiency',
        'Price movement in higher/lower correlates 78% with final outcome'
      ],
      recommendations: [
        'Higher is value when both teams have >1.4 xG',
        'Lower markets excellent for accumulator building',
        'Monitor line movements for entry timing',
        'Higher/lower 2.5 line is the sweet spot for value'
      ],
      riskLevel: 'Medium',
      winRate: 58.1,
      avgROI: 6.3,
      marketEfficiency: 90.1
    },
    turbo: {
      insights: [
        'Turbo next-goal markets resolve within avg 8.3 minutes',
        'Home team next goal probability 54.8% in balanced matchups',
        'No-more-goals turbo profitable 41.2% in 75+ minute matches',
        'Turbo markets show fastest odds decay of all market types'
      ],
      recommendations: [
        'Use turbo for quick bankroll boosts in live trading',
        'Next goal home slightly better value than away in neutral venues',
        'No-more-goals turbo strongest signal in final 15 minutes',
        'Avoid turbo in first 10 minutes - low data confidence'
      ],
      riskLevel: 'High',
      winRate: 44.7,
      avgROI: 8.9,
      marketEfficiency: 82.5
    }
  }

  const analysis = marketType === 'all'
    ? Object.entries(analyses).map(([type, data]) => ({ type, ...data }))
    : analyses[marketType] || analyses.even_odd

  return NextResponse.json({
    marketType,
    signal,
    analysis,
    timestamp: new Date().toISOString(),
  })
}
