/**
 * Exchange Rate API client - Module 34 gap (Req 34.6).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/exchange-rates'

export interface ExchangeRate {
  id: string
  currency_code: string
  rate_date: string
  rate_to_inr: number
  set_by: string | null
  created_at: string
}

export interface ExchangeRateCreate {
  currency_code: string
  rate_date: string
  rate_to_inr: number
}

export interface RateLookup {
  currency_code: string
  on_date: string
  rate_to_inr: number
}

export async function listRates(currency_code?: string): Promise<ExchangeRate[]> {
  const { data } = await apiClient.get<ExchangeRate[]>(BASE, {
    params: currency_code ? { currency_code } : {},
  })
  return Array.isArray(data) ? data : []
}

export async function createRate(body: ExchangeRateCreate): Promise<ExchangeRate> {
  const { data } = await apiClient.post<ExchangeRate>(BASE, body)
  return data
}

export async function latestRate(currency: string, on_date?: string): Promise<RateLookup> {
  const { data } = await apiClient.get<RateLookup>(`${BASE}/${currency}`, {
    params: on_date ? { on_date } : {},
  })
  return data
}
