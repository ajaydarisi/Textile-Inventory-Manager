export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          financial_year: string;
          gstin: string | null;
          state: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          financial_year: string;
          gstin?: string | null;
          state?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          financial_year?: string;
          gstin?: string | null;
          state?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          full_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          email: string;
          full_name?: string | null;
          role?: string;
        };
        Update: {
          company_id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_groups: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          parent_id: string | null;
          nature: string;
          is_system: boolean;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          parent_id?: string | null;
          nature: string;
          is_system?: boolean;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          nature?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_groups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      ledgers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          ledger_group_id: string;
          gstin: string | null;
          opening_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          ledger_group_id: string;
          gstin?: string | null;
          opening_balance?: number;
        };
        Update: {
          name?: string;
          ledger_group_id?: string;
          gstin?: string | null;
          opening_balance?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ledgers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledgers_ledger_group_id_fkey";
            columns: ["ledger_group_id"];
            isOneToOne: false;
            referencedRelation: "ledger_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      godowns: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "godowns_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_items: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          article_no: string | null;
          category: string | null;
          unit: string;
          gst_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          article_no?: string | null;
          category?: string | null;
          unit?: string;
          gst_rate?: number;
        };
        Update: {
          name?: string;
          article_no?: string | null;
          category?: string | null;
          unit?: string;
          gst_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "stock_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vouchers: {
        Row: {
          id: string;
          company_id: string;
          type: string;
          number: number;
          date: string;
          party_ledger_id: string;
          account_ledger_id: string | null;
          sub_total: number;
          gst_total: number;
          discount: number;
          freight: number;
          grand_total: number;
          narration: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type: string;
          number: number;
          date: string;
          party_ledger_id: string;
          account_ledger_id?: string | null;
          sub_total?: number;
          gst_total?: number;
          discount?: number;
          freight?: number;
          grand_total?: number;
          narration?: string | null;
          created_by?: string | null;
        };
        Update: {
          type?: string;
          number?: number;
          date?: string;
          party_ledger_id?: string;
          account_ledger_id?: string | null;
          sub_total?: number;
          gst_total?: number;
          discount?: number;
          freight?: number;
          grand_total?: number;
          narration?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_party_ledger_id_fkey";
            columns: ["party_ledger_id"];
            isOneToOne: false;
            referencedRelation: "ledgers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_account_ledger_id_fkey";
            columns: ["account_ledger_id"];
            isOneToOne: false;
            referencedRelation: "ledgers";
            referencedColumns: ["id"];
          },
        ];
      };
      voucher_items: {
        Row: {
          id: string;
          voucher_id: string;
          stock_item_id: string;
          shade: string | null;
          lot: string | null;
          quantity: number;
          rate: number;
          amount: number;
          gst_amount: number;
        };
        Insert: {
          id?: string;
          voucher_id: string;
          stock_item_id: string;
          shade?: string | null;
          lot?: string | null;
          quantity: number;
          rate: number;
          amount: number;
          gst_amount?: number;
        };
        Update: {
          stock_item_id?: string;
          shade?: string | null;
          lot?: string | null;
          quantity?: number;
          rate?: number;
          amount?: number;
          gst_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_items_voucher_id_fkey";
            columns: ["voucher_id"];
            isOneToOne: false;
            referencedRelation: "vouchers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_items_stock_item_id_fkey";
            columns: ["stock_item_id"];
            isOneToOne: false;
            referencedRelation: "stock_items";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          id: string;
          voucher_id: string;
          ledger_id: string;
          debit: number;
          credit: number;
        };
        Insert: {
          id?: string;
          voucher_id: string;
          ledger_id: string;
          debit?: number;
          credit?: number;
        };
        Update: {
          ledger_id?: string;
          debit?: number;
          credit?: number;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_voucher_id_fkey";
            columns: ["voucher_id"];
            isOneToOne: false;
            referencedRelation: "vouchers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_ledger_id_fkey";
            columns: ["ledger_id"];
            isOneToOne: false;
            referencedRelation: "ledgers";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          voucher_id: string;
          stock_item_id: string;
          godown_id: string | null;
          shade: string | null;
          lot: string | null;
          quantity: number;
          movement_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          voucher_id: string;
          stock_item_id: string;
          godown_id?: string | null;
          shade?: string | null;
          lot?: string | null;
          quantity: number;
          movement_type: string;
        };
        Update: {
          stock_item_id?: string;
          godown_id?: string | null;
          shade?: string | null;
          lot?: string | null;
          quantity?: number;
          movement_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_voucher_id_fkey";
            columns: ["voucher_id"];
            isOneToOne: false;
            referencedRelation: "vouchers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey";
            columns: ["stock_item_id"];
            isOneToOne: false;
            referencedRelation: "stock_items";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          company_id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_data: Json | null;
          new_data: Json | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_data?: Json | null;
          new_data?: Json | null;
          user_id?: string | null;
        };
        Update: {
          old_data?: Json | null;
          new_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_voucher: {
        Args: {
          p_company_id: string;
          p_type: string;
          p_date: string;
          p_party_ledger_id: string;
          p_account_ledger_id: string;
          p_items: Json;
          p_sub_total: number;
          p_gst_total: number;
          p_discount: number;
          p_freight: number;
          p_grand_total: number;
          p_narration?: string;
        };
        Returns: string;
      };
      get_ledger_balance: {
        Args: {
          p_ledger_id: string;
        };
        Returns: number;
      };
      get_stock_summary: {
        Args: {
          p_company_id: string;
        };
        Returns: {
          stock_item_id: string;
          item_name: string;
          category: string;
          unit: string;
          current_qty: number;
        }[];
      };
      get_next_voucher_number: {
        Args: {
          p_company_id: string;
          p_type: string;
        };
        Returns: number;
      };
      get_user_company_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_user_account: {
        Args: {
          p_company_name: string;
          p_full_name?: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
