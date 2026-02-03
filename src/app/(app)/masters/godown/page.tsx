"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { Godown } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function GodownPage() {
  const { company } = useCompany();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!company?.id) return;
    async function fetch() {
      const { data } = await supabase
        .from("godowns")
        .select("*")
        .eq("company_id", company!.id);
      if (data) setGodowns(data as unknown as Godown[]);
    }
    fetch();
  }, [company?.id, supabase]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Godowns / Warehouses</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Godowns</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {godowns.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{g.created_at}</TableCell>
                </TableRow>
              ))}
              {godowns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    No godowns found. Connect to Supabase to load data.
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
