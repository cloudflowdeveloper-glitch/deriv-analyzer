import { NextResponse } from 'next/server'

// POST /api/analysis/accumulator - Analyze accumulator
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { legs } = body

    if (!legs || !Array.isArray(legs) || legs.length === 0) {
      return NextResponse.json(
        { error: 'At least one leg is required' },
        { status: 400 }
      )
    }

    // Calculate combined odds
    const combinedOdds = legs.reduce((acc: number, leg: { odds: number }) => acc * leg.odds, 1)

    // Calculate combined probability (simplified)
    const combinedProb = legs.reduce((acc: number, leg: { impliedProb: number }) => {
      return acc * (leg.impliedProb / 100)
    }, 1) * 100

    // Calculate expected value
    const avgConfidence = legs.reduce((acc: number, leg: { confidence: number }) => acc + leg.confidence, 0) / legs.length

    // Risk assessment
    const riskLevel = legs.length <= 2 ? 'Low' : legs.length <= 4 ? 'Medium' : legs.length <= 6 ? 'High' : 'Very High'

    // Kelly criterion for the accumulator
    const kelly = Math.max(0, (avgConfidence * combinedOdds - 1) / (combinedOdds - 1))

    // Optimal stake percentage
    const optimalStake = (kelly * 100).toFixed(1)

    // Recommendations based on analysis
    const recommendations: string[] = []
    if (combinedOdds > 100) {
      recommendations.push('Very high combined odds - consider reducing legs for sustainable growth')
    }
    if (avgConfidence > 0.7) {
      recommendations.push('Strong average confidence across selections')
    } else if (avgConfidence < 0.4) {
      recommendations.push('Low average confidence - consider replacing weaker legs')
    }
    if (legs.length > 5) {
      recommendations.push('High leg count increases variance significantly')
    }
    if (combinedProb < 5) {
      recommendations.push('Very low combined probability - high risk of loss')
    }

    // Signal analysis
    const buyCount = legs.filter((l: { signal: string }) => l.signal === 'buy' || l.signal === 'strong_buy').length
    const sellCount = legs.filter((l: { signal: string }) => l.signal === 'sell' || l.signal === 'strong_sell').length

    const analysis = {
      legs: legs.length,
      combinedOdds: parseFloat(combinedOdds.toFixed(2)),
      combinedProbability: parseFloat(combinedProb.toFixed(2)),
      avgConfidence: parseFloat(avgConfidence.toFixed(3)),
      kellyCriterion: parseFloat(kelly.toFixed(3)),
      optimalStake: parseFloat(optimalStake),
      riskLevel,
      buySignals: buyCount,
      sellSignals: sellCount,
      recommendations,
      signalSummary: buyCount > sellCount ? 'Favorable' : sellCount > buyCount ? 'Caution' : 'Mixed',
    }

    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
