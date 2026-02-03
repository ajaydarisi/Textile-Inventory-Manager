"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

export default function OutstandingReportPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Outstanding Report</h1>
      <Card>
        <CardHeader>
          <CardTitle>Receivables &amp; Payables</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <IndianRupee className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Connect to Supabase to view outstanding balances.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Shows pending receivables and payables across all parties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
