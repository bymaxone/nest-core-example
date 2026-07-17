/**
 * @fileoverview Overview route placeholder.
 *
 * Replaced with the real status strip and quick links in a follow-up task;
 * this placeholder only proves the shell renders every route.
 *
 * @layer screen
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function OverviewPage() {
  return (
    <Card>
      <CardHeader accent>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Status strip and quick links land here.</CardDescription>
      </CardHeader>
      <CardContent>Content coming up.</CardContent>
    </Card>
  )
}
