"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function TrialBalancePage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trial Balance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Trial Balance Statement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Connect to Supabase to view trial balance.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Shows debit and credit totals for all ledgers to verify accounting accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
