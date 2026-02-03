"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { StockSummaryRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StockReportPage() {
  const { company } = useCompany();
  const [stockData, setStockData] = useState<StockSummaryRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!company?.id) return;
    async function fetch() {
      const { data } = await supabase.rpc("get_stock_summary", {
        p_company_id: company!.id,
      });
      if (data) setStockData(data as unknown as StockSummaryRow[]);
    }
    fetch();
  }, [company?.id, supabase]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Stock Summary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData.map((row) => (
                <TableRow key={row.stock_item_id}>
                  <TableCell className="font-medium">{row.item_name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell className={cn("text-right font-mono font-bold", row.current_qty < 100 ? "text-red-500" : "")}>
                    {row.current_qty.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {stockData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No stock data. Connect to Supabase to load inventory.
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
