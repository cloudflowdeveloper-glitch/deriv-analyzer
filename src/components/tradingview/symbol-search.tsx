'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_SYMBOLS, SYMBOL_CATEGORIES, SymbolItem, searchSymbols } from '@/lib/trading-types'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SymbolSearchProps {
  value: string
  onChange: (symbol: string) => void
  className?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Crypto: 'bg-amber-100 text-amber-700',
  Forex: 'bg-sky-100 text-sky-700',
  Stocks: 'bg-emerald-100 text-emerald-700',
  Indices: 'bg-purple-100 text-purple-700',
  Commodities: 'bg-rose-100 text-rose-700',
}

export function SymbolSearch({ value, onChange, className }: SymbolSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentSymbol = ALL_SYMBOLS.find(s => s.symbol === value)

  const filteredSymbols = useMemo(() => {
    let results = searchSymbols(query)
    if (activeCategory) {
      results = results.filter(s => s.category === activeCategory)
    }
    return results
  }, [query, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sym of ALL_SYMBOLS) {
      counts[sym.category] = (counts[sym.category] || 0) + 1
    }
    return counts
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        className="flex items-center gap-2 h-9 px-3 rounded-md border bg-background text-xs hover:bg-accent/50 transition-colors w-full min-w-0"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium truncate">
          {currentSymbol ? currentSymbol.name : value.split(':').pop() || value}
        </span>
        {currentSymbol && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 hidden sm:inline-flex">
            {currentSymbol.exchange}
          </Badge>
        )}
        <ChevronDown className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95 overflow-hidden"
          style={{ width: 'min(100%, 420px)' }}
        >
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search symbol, name, exchange..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
              {query && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto">
            <button
              type="button"
              className={cn(
                'px-2 py-1 text-[10px] rounded-md whitespace-nowrap transition-colors',
                !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
              onClick={() => setActiveCategory(null)}
            >
              All ({ALL_SYMBOLS.length})
            </button>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                className={cn(
                  'px-2 py-1 text-[10px] rounded-md whitespace-nowrap transition-colors',
                  activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {cat} ({count})
              </button>
            ))}
          </div>

          {/* Symbol List */}
          <ScrollArea className="max-h-[320px]">
            <div className="p-1">
              {filteredSymbols.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No symbols found
                </div>
              ) : (
                filteredSymbols.map((sym) => {
                  const isSelected = sym.symbol === value
                  return (
                    <button
                      key={sym.symbol}
                      type="button"
                      className={cn(
                        'flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-left text-xs transition-colors',
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50'
                      )}
                      onClick={() => {
                        onChange(sym.symbol)
                        setOpen(false)
                        setQuery('')
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{sym.name}</span>
                          {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{sym.symbol}</span>
                          <Badge
                            variant="outline"
                            className={cn('text-[8px] px-1 py-0 leading-tight', CATEGORY_COLORS[sym.category] || 'bg-gray-100 text-gray-700')}
                          >
                            {sym.category}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{sym.exchange}</span>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
