"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { VoucherType, Ledger, StockItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calendar, Save } from "lucide-react";
import { format } from "date-fns";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const voucherSchema = z.object({
  type: z.enum(["PURCHASE", "SALES", "RECEIPT", "PAYMENT"]),
  date: z.date(),
  partyLedgerId: z.string().min(1, "Party is required"),
  accountLedgerId: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item is required"),
        shade: z.string(),
        lot: z.string(),
        quantity: z.number().min(0.01, "Qty must be > 0"),
        rate: z.number().min(0, "Rate must be positive"),
      })
    )
    .optional(),
  amount: z.number().optional(),
  narration: z.string().optional(),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherEntryFormProps {
  defaultType: VoucherType;
}

export default function VoucherEntryForm({
  defaultType,
}: VoucherEntryFormProps) {
  const { company } = useCompany();
  const { toast: showToast } = useToast();
  const supabase = createClient();

  const [voucherType, setVoucherType] = useState<VoucherType>(defaultType);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [nextNumber, setNextNumber] = useState(1);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      type: defaultType,
      date: new Date(),
      partyLedgerId: "",
      items: [{ itemId: "", shade: "", lot: "", quantity: 0, rate: 0 }],
      amount: 0,
      narration: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!company?.id) return;

    async function fetchData() {
      const [lRes, iRes, nRes] = await Promise.all([
        supabase.from("ledgers").select("*, ledger_groups(name)").eq("company_id", company!.id),
        supabase.from("stock_items").select("*").eq("company_id", company!.id),
        supabase.rpc("get_next_voucher_number", {
          p_company_id: company!.id,
          p_type: voucherType,
        }),
      ]);
      if (lRes.data) setLedgers(lRes.data as unknown as Ledger[]);
      if (iRes.data) setItems(iRes.data as unknown as StockItem[]);
      if (nRes.data) setNextNumber(nRes.data as number);
    }

    fetchData();
  }, [company?.id, voucherType, supabase]);

  const partyLedgers = ledgers.filter((l) => {
    const groupName = (l.ledger_group as unknown as { name: string })?.name;
    if (voucherType === "PURCHASE")
      return (
        groupName === "Sundry Creditors" ||
        groupName === "Cash" ||
        groupName === "Bank"
      );
    if (voucherType === "SALES")
      return (
        groupName === "Sundry Debtors" ||
        groupName === "Cash" ||
        groupName === "Bank"
      );
    return true;
  });

  const watchItems = form.watch("items");
  const subTotal =
    watchItems?.reduce((sum, item) => sum + item.quantity * item.rate, 0) || 0;
  const gstTotal =
    watchItems?.reduce((sum, item) => {
      const stockItem = items.find((i) => i.id === item.itemId);
      const rate = stockItem?.gst_rate || 5;
      return sum + item.quantity * item.rate * (rate / 100);
    }, 0) || 0;
  const grandTotal = subTotal + gstTotal;

  const onSubmit = async (data: VoucherFormValues) => {
    if (!company?.id) return;

    const fullItems =
      data.items?.map((item) => {
        const stockItem = items.find((i) => i.id === item.itemId);
        const amount = item.quantity * item.rate;
        const gstAmount = amount * ((stockItem?.gst_rate || 0) / 100);
        return {
          stock_item_id: item.itemId,
          shade: item.shade,
          lot: item.lot,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          gst_amount: gstAmount,
        };
      }) || [];

    // Find account ledger (Sales/Purchase account)
    const accountLedger = ledgers.find((l) => {
      const groupName = (l.ledger_group as unknown as { name: string })?.name;
      if (voucherType === "PURCHASE") return groupName === "Purchase Account";
      if (voucherType === "SALES") return groupName === "Sales Account";
      return false;
    });

    const isAccounting =
      voucherType === "RECEIPT" || voucherType === "PAYMENT";

    const { error } = await supabase.rpc("create_voucher", {
      p_company_id: company.id,
      p_type: voucherType,
      p_date: format(data.date, "yyyy-MM-dd"),
      p_party_ledger_id: data.partyLedgerId,
      p_account_ledger_id:
        data.accountLedgerId || accountLedger?.id || data.partyLedgerId,
      p_items: JSON.stringify(isAccounting ? [] : fullItems),
      p_sub_total: isAccounting ? (data.amount || 0) : subTotal,
      p_gst_total: isAccounting ? 0 : gstTotal,
      p_discount: 0,
      p_freight: 0,
      p_grand_total: isAccounting ? (data.amount || 0) : grandTotal,
      p_narration: data.narration || undefined,
    });

    if (error) {
      showToast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    showToast({
      title: "Voucher Saved",
      description: `${voucherType} voucher has been saved successfully.`,
    });

    form.reset({
      type: voucherType,
      date: new Date(),
      partyLedgerId: "",
      items: [{ itemId: "", shade: "", lot: "", quantity: 0, rate: 0 }],
      amount: 0,
      narration: "",
    });

    setNextNumber((prev) => prev + 1);
  };

  const isInventoryVoucher =
    voucherType === "PURCHASE" || voucherType === "SALES";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Voucher Entry</h1>
        <div className="flex gap-1 sm:gap-2 bg-muted p-1 rounded-lg overflow-x-auto">
          {(["PURCHASE", "SALES", "RECEIPT", "PAYMENT"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => {
                  setVoucherType(type);
                  form.setValue("type", type);
                }}
                className={cn(
                  "px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap",
                  voucherType === type
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type}
              </button>
            )
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() ||
                              date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partyLedgerId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-2">
                      <FormLabel>
                        {voucherType === "PURCHASE"
                          ? "Supplier Account"
                          : voucherType === "SALES"
                          ? "Buyer Account"
                          : "Party Account"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Party" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partyLedgers.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end pb-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Voucher No.
                  </div>
                  <div className="text-xl font-bold font-mono">
                    #{nextNumber}
                  </div>
                </div>
              </div>

              {/* Inventory Section (Only for Purchase/Sales) */}
              {isInventoryVoucher ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block border rounded-md overflow-hidden">
                    <Table className="dense-table">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[30%]">
                            Item Details
                          </TableHead>
                          <TableHead>Shade</TableHead>
                          <TableHead>Lot No.</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const qty =
                            form.watch(`items.${index}.quantity`) || 0;
                          const rate = form.watch(`items.${index}.rate`) || 0;
                          const amount = qty * rate;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.itemId`}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="h-8 border-transparent focus:border-input">
                                        <SelectValue placeholder="Select Item" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {items.map((i) => (
                                          <SelectItem key={i.id} value={i.id}>
                                            {i.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(`items.${index}.shade`)}
                                  className="h-8 border-transparent focus:border-input"
                                  placeholder="Shade"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  {...form.register(`items.${index}.lot`)}
                                  className="h-8 border-transparent focus:border-input"
                                  placeholder="Lot"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(`items.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                  className="h-8 text-right border-transparent focus:border-input"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  {...form.register(`items.${index}.rate`, {
                                    valueAsNumber: true,
                                  })}
                                  className="h-8 text-right border-transparent focus:border-input"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="p-2 bg-muted/20 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          append({
                            itemId: "",
                            shade: "",
                            lot: "",
                            quantity: 0,
                            rate: 0,
                          })
                        }
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-3">
                    {fields.map((field, index) => {
                      const qty = form.watch(`items.${index}.quantity`) || 0;
                      const rate = form.watch(`items.${index}.rate`) || 0;
                      const amount = qty * rate;

                      return (
                        <Card key={field.id} className="relative">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="text-xs font-medium text-muted-foreground">
                                Item #{index + 1}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.itemId`}
                              render={({ field }) => (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Item</Label>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {items.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                          {i.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Shade</Label>
                                <Input
                                  {...form.register(`items.${index}.shade`)}
                                  placeholder="Shade"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Lot No.</Label>
                                <Input
                                  {...form.register(`items.${index}.lot`)}
                                  placeholder="Lot"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Qty</Label>
                                <Input
                                  type="number"
                                  {...form.register(`items.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Rate</Label>
                                <Input
                                  type="number"
                                  {...form.register(`items.${index}.rate`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Amount</Label>
                                <div className="h-9 flex items-center text-sm font-mono text-muted-foreground">
                                  {amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          itemId: "",
                          shade: "",
                          lot: "",
                          quantity: 0,
                          rate: 0,
                        })
                      }
                      className="w-full text-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                </>
              ) : (
                /* Accounting Voucher (Receipt/Payment) */
                <Card className="bg-muted/10 border-dashed">
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                                &#8377;
                              </span>
                              <Input
                                type="number"
                                className="pl-8 text-lg font-mono h-12"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Footer / Totals */}
              {isInventoryVoucher && (
                <div className="flex justify-end">
                  <div className="w-full sm:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sub Total:</span>
                      <span className="font-mono">{subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST Total:</span>
                      <span className="font-mono">{gstTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span className="font-mono">
                        &#8377;{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full sm:w-32">
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
