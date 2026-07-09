import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { Clause } from '@/types'
import ScanClient from './ScanClient'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('id, user_id, file_name, clauses')
    .eq('id', id)
    .maybeSingle()

  if (!contract || contract.user_id !== user?.userId) {
    notFound()
  }

  const clauses: Clause[] = Array.isArray(contract.clauses) ? contract.clauses : []

  return (
    <ScanClient contractId={contract.id} fileName={contract.file_name} clauses={clauses} />
  )
}
