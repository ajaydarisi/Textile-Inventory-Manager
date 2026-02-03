"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { StockItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StockItemsPage() {
  const { company } = useCompany();
  const [items, setItems] = useState<StockItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!company?.id) return;
    async function fetch() {
      const { data } = await supabase
        .from("stock_items")
        .select("*")
        .eq("company_id", company!.id);
      if (data) setItems(data as unknown as StockItem[]);
    }
    fetch();
  }, [company?.id, supabase]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Stock Items</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Article No.</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">GST %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.article_no}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.gst_rate}%</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No stock items found. Connect to Supabase to load data.
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
