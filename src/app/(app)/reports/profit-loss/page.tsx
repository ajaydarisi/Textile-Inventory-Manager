"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ProfitLossPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profit &amp; Loss</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profit &amp; Loss Statement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Connect to Supabase to view profit &amp; loss report.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Shows income and expense summary for the current financial year.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
