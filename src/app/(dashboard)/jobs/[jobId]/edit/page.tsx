import { redirect } from "next/navigation"

export default async function JobEditRedirectPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  redirect(`/jobs/create?jobId=${jobId}`)
}
