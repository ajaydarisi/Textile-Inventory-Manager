"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LedgerRow {
  id: string;
  name: string;
  gstin: string | null;
  opening_balance: number;
  ledger_groups: { name: string } | null;
}

export default function LedgersPage() {
  const { company } = useCompany();
  const [ledgers, setLedgers] = useState<LedgerRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!company?.id) return;
    async function fetch() {
      const { data } = await supabase
        .from("ledgers")
        .select("*, ledger_groups(name)")
        .eq("company_id", company!.id);
      if (data) setLedgers(data as unknown as LedgerRow[]);
    }
    fetch();
  }, [company?.id, supabase]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ledger Accounts</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Ledgers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead className="text-right">Opening Bal.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell className="font-medium">{ledger.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ledger.ledger_groups?.name || "-"}</Badge>
                  </TableCell>
                  <TableCell>{ledger.gstin || "-"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {ledger.opening_balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {ledgers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No ledgers found. Connect to Supabase to load data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
