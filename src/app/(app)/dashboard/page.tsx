"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { Voucher, Ledger, StockItem } from "@/lib/types";
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const { company } = useCompany();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!company?.id) return;

    async function fetchData() {
      const [vRes, lRes, iRes] = await Promise.all([
        supabase
          .from("vouchers")
          .select("*")
          .eq("company_id", company!.id)
          .order("date", { ascending: false })
          .limit(20),
        supabase.from("ledgers").select("*").eq("company_id", company!.id),
        supabase.from("stock_items").select("*").eq("company_id", company!.id),
      ]);
      if (vRes.data) setVouchers(vRes.data as unknown as Voucher[]);
      if (lRes.data) setLedgers(lRes.data as unknown as Ledger[]);
      if (iRes.data) setItems(iRes.data as unknown as StockItem[]);
    }

    fetchData();
  }, [company?.id, supabase]);

  const totalSales = vouchers
    .filter((v) => v.type === "SALES")
    .reduce((sum, v) => sum + v.grand_total, 0);

  const totalPurchase = vouchers
    .filter((v) => v.type === "PURCHASE")
    .reduce((sum, v) => sum + v.grand_total, 0);

  const recentVouchers = [...vouchers]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const chartData = [
    { name: "Mon", sales: 40000, purchase: 24000 },
    { name: "Tue", sales: 30000, purchase: 13980 },
    { name: "Wed", sales: 20000, purchase: 9800 },
    { name: "Thu", sales: 27800, purchase: 39080 },
    { name: "Fri", sales: 18900, purchase: 48000 },
    { name: "Sat", sales: 23900, purchase: 38000 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <div className="text-sm text-muted-foreground">
          FY: {company?.financial_year || "---"}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              &#8377;{totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +20.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Purchase
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              &#8377;{totalPurchase.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3" /> -4.5%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receivables
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">&#8377;1,24,500</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending from 12 parties
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Value
            </CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">&#8377;8,45,200</div>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} Unique Items
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Sales vs Purchase</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="purchase"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVouchers.map((voucher) => {
                const party =
                  ledgers.find((l) => l.id === voucher.party_ledger_id)?.name ||
                  "Unknown Party";
                return (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{party}</span>
                      <span className="text-xs text-muted-foreground">
                        {voucher.type} #{voucher.number} &bull; {voucher.date}
                      </span>
                    </div>
                    <div className="font-semibold text-sm">
                      &#8377;{voucher.grand_total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {recentVouchers.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No vouchers entered yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
