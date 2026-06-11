import { NextResponse } from 'next/server'
import { AccumulatorLeg, SIGNAL_COLORS } from '@/lib/trading-types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { legs } = body

    if (!legs || !Array.isArray(legs) || legs.length === 0) {
      return NextResponse.json({ error: 'At least one leg required' }, { status: 400 })
    }

    // Calculate combined odds based on confidence
    const combinedOdds = legs.reduce((acc: number, leg: AccumulatorLeg) => {
      return acc * (1 + (leg.confidence / 100) * leg.odds)
    }, 1)

    // Combined probability
    const combinedProb = legs.reduce((acc: number, leg: AccumulatorLeg) => {
      return acc * (leg.confidence / 100)
    }, 1) * 100

    const avgConfidence = legs.reduce((s: number, l: AccumulatorLeg) => s + l.confidence, 0) / legs.length
    const buyCount = legs.filter((l: AccumulatorLeg) => l.signal === 'buy' || l.signal === 'strong_buy').length
    const sellCount = legs.filter((l: AccumulatorLeg) => l.signal === 'sell' || l.signal === 'strong_sell').length

    const riskLevel = legs.length <= 2 ? 'Low' : legs.length <= 4 ? 'Medium' : legs.length <= 6 ? 'High' : 'Very High'
    const kelly = Math.max(0, (avgConfidence * combinedOdds / 100 - 1) / (combinedOdds - 1))
    const optimalStake = (kelly * 100)

    const recommendations: string[] = []
    if (combinedOdds > 10) recommendations.push('High combined odds — consider reducing legs')
    if (avgConfidence > 70) recommendations.push('Strong average confidence across selections')
    if (avgConfidence < 40) recommendations.push('Low average confidence — review weak legs')
    if (legs.length > 5) recommendations.push('Many legs increase variance significantly')
    if (buyCount < sellCount) recommendations.push('More sell signals than buy — reconsider composition')
    if (combinedProb < 10) recommendations.push('Very low combined probability — high risk')

    return NextResponse.json({
      analysis: {
        legs: legs.length,
        combinedOdds: parseFloat(combinedOdds.toFixed(2)),
        combinedProbability: parseFloat(combinedProb.toFixed(2)),
        avgConfidence: parseFloat(avgConfidence.toFixed(1)),
        kellyCriterion: parseFloat(kelly.toFixed(4)),
        optimalStake: parseFloat(optimalStake.toFixed(1)),
        riskLevel,
        buySignals: buyCount,
        sellSignals: sellCount,
        signalSummary: buyCount > sellCount ? 'Favorable' : sellCount > buyCount ? 'Caution' : 'Mixed',
        recommendations,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
