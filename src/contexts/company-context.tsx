"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-context";
import type { Company } from "@/lib/types";

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  loading: true,
  refreshCompany: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      setCompany(data);
      setLoading(false);
    };

    fetchCompany();
  }, [profile?.company_id, supabase]);

  const refreshCompany = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();
    setCompany(data);
  };

  return (
    <CompanyContext.Provider value={{ company, loading, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
