"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";

export default function CompanyPage() {
  const { company, loading, refreshCompany } = useCompany();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  // Edit mode toggles
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  // Company form state
  const [companyName, setCompanyName] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [gstin, setGstin] = useState("");
  const [state, setState] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Populate forms when data loads
  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
      setFinancialYear(company.financial_year);
      setGstin(company.gstin || "");
      setState(company.state || "");
    }
  }, [company]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const resetCompanyForm = () => {
    if (company) {
      setCompanyName(company.name);
      setFinancialYear(company.financial_year);
      setGstin(company.gstin || "");
      setState(company.state || "");
    }
    setEditingCompany(false);
  };

  const resetProfileForm = () => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
    setEditingProfile(false);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSavingCompany(true);

    const { error } = await supabase
      .from("companies")
      .update({
        name: companyName,
        financial_year: financialYear,
        gstin: gstin || null,
        state: state || null,
      })
      .eq("id", company.id);

    setSavingCompany(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await refreshCompany();
      setEditingCompany(false);
      toast({ title: "Saved", description: "Company details updated." });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName || null })
      .eq("id", profile.id);

    setSavingProfile(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await refreshProfile();
      setEditingProfile(false);
      toast({ title: "Saved", description: "Profile updated." });
    }
  };

  if (loading)
    return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>

      {/* Company Details */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Company details that appear on invoices and reports.
            </CardDescription>
          </div>
          {!editingCompany && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCompany(true)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingCompany ? (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financialYear">Financial Year</Label>
                  <Input
                    id="financialYear"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    placeholder="2024-2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 27AABCT1234F1Z5"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetCompanyForm}
                  disabled={savingCompany}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingCompany}>
                  {savingCompany ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Company Name
                </div>
                <div className="font-medium">
                  {company?.name || "Not configured"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Financial Year
                </div>
                <div className="font-medium">
                  {company?.financial_year || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">GSTIN</div>
                <div className="font-mono">{company?.gstin || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">State</div>
                <div className="font-medium">{company?.state || "-"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Profile */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your personal details.</CardDescription>
          </div>
          {!editingProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={profile?.role || ""}
                    disabled
                    className="text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetProfileForm}
                  disabled={savingProfile}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="font-medium">
                  {profile?.full_name || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{profile?.email || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium">{profile?.role || "-"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
