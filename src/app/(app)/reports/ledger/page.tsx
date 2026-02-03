"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LedgerReportPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ledger Report</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ledger Statement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Connect to Supabase to view ledger reports.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            This report shows all journal entries for a selected ledger with running balance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
