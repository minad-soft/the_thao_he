"use client";

import { useState, useEffect } from "react";
import type { School, PricingPackage, Shift, Subject, BankAccount, PaymentMethod } from "@/types/database.types";
import SchoolsTable from "@/modules/settings/SchoolsTable";
import PricingTable from "@/modules/settings/PricingTable";
import ShiftsTable from "@/modules/settings/ShiftsTable";
import SubjectsTable from "@/modules/settings/SubjectsTable";
import BankAccountsTable from "@/modules/settings/BankAccountsTable";
import PaymentMethodsTable from "@/modules/settings/PaymentMethodsTable";
import "./settings.css";

type TabKey = "schools" | "pricing" | "shifts" | "subjects" | "bank-accounts" | "payment-methods";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "schools", label: "Trường học", icon: "🏫" },
  { key: "subjects", label: "Môn học", icon: "🏅" },
  { key: "pricing", label: "Bảng giá", icon: "💰" },
  { key: "shifts", label: "Ca học", icon: "🕐" },
  { key: "bank-accounts", label: "Ngân hàng", icon: "🏦" },
  { key: "payment-methods", label: "Thanh toán", icon: "💳" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schoolsRes, packagesRes, shiftsRes, subjectsRes, bankRes, paymentRes] = await Promise.all([
          fetch("/api/schools"),
          fetch("/api/pricing-packages"),
          fetch("/api/shifts"),
          fetch("/api/subjects"),
          fetch("/api/bank-accounts"),
          fetch("/api/payment-methods"),
        ]);

        if (schoolsRes.ok) setSchools(await schoolsRes.json());
        if (packagesRes.ok) setPackages(await packagesRes.json());
        if (shiftsRes.ok) setShifts(await shiftsRes.json());
        if (subjectsRes.ok) setSubjects(await subjectsRes.json());
        if (bankRes.ok) setBankAccounts(await bankRes.json());
        if (paymentRes.ok) setPaymentMethods(await paymentRes.json());
      } catch (err) {
        console.error("Failed to fetch settings data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cài đặt hệ thống</h1>
        <p className="page-subtitle">Quản lý Trường học, Môn học, Bảng giá, Ca học, Ngân hàng và Thanh toán</p>
      </div>

      {/* Stats Row */}
      <div className="settings-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-indigo">🏫</div>
          <div>
            <div className="stat-value">{schools.length}</div>
            <div className="stat-label">Trường học</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-cyan">🏅</div>
          <div>
            <div className="stat-value">{subjects.length}</div>
            <div className="stat-label">Môn học</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-emerald">💰</div>
          <div>
            <div className="stat-value">{packages.length}</div>
            <div className="stat-label">Gói học</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">🕐</div>
          <div>
            <div className="stat-value">{shifts.length}</div>
            <div className="stat-label">Ca học</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">🏦</div>
          <div>
            <div className="stat-value">{bankAccounts.length}</div>
            <div className="stat-label">Ngân hàng</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-rose">💳</div>
          <div>
            <div className="stat-value">{paymentMethods.length}</div>
            <div className="stat-label">Thanh toán</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="settings-content">
          {activeTab === "schools" && (
            <SchoolsTable
              schools={schools}
              onSchoolAdded={(s) => setSchools((prev) => [...prev, s])}
              onSchoolUpdated={(s) => setSchools((prev) => prev.map((item) => (item.id === s.id ? s : item)))}
              onSchoolDeleted={(id) => setSchools((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
          {activeTab === "subjects" && (
            <SubjectsTable
              subjects={subjects}
              onSubjectAdded={(s) => setSubjects((prev) => [...prev, s])}
              onSubjectUpdated={(s) => setSubjects((prev) => prev.map((item) => (item.id === s.id ? s : item)))}
              onSubjectDeleted={(id) => setSubjects((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
          {activeTab === "pricing" && (
            <PricingTable
              packages={packages}
              subjects={subjects}
              onPackageAdded={(p) => setPackages((prev) => [...prev, p])}
              onPackageUpdated={(p) => setPackages((prev) => prev.map((item) => (item.id === p.id ? p : item)))}
              onPackageDeleted={(id) => setPackages((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
          {activeTab === "shifts" && (
            <ShiftsTable
              shifts={shifts}
              subjects={subjects}
              onShiftAdded={(s) => setShifts((prev) => [...prev, s])}
              onShiftUpdated={(s) => setShifts((prev) => prev.map((item) => (item.id === s.id ? s : item)))}
              onShiftDeleted={(id) => setShifts((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
          {activeTab === "bank-accounts" && (
            <BankAccountsTable
              bankAccounts={bankAccounts}
              onBankAccountAdded={(a) => setBankAccounts((prev) => [...prev, a])}
              onBankAccountUpdated={(a) => setBankAccounts((prev) => prev.map((item) => (item.id === a.id ? a : item)))}
              onBankAccountDeleted={(id) => setBankAccounts((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
          {activeTab === "payment-methods" && (
            <PaymentMethodsTable
              paymentMethods={paymentMethods}
              onPaymentMethodAdded={(m) => setPaymentMethods((prev) => [...prev, m])}
              onPaymentMethodUpdated={(m) => setPaymentMethods((prev) => prev.map((item) => (item.id === m.id ? m : item)))}
              onPaymentMethodDeleted={(id) => setPaymentMethods((prev) => prev.filter((item) => item.id !== id))}
            />
          )}
        </div>
      )}
    </div>
  );
}
