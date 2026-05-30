import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { BankAccountInsert } from "@/types/database.types";

// GET /api/bank-accounts — Lấy danh sách tài khoản ngân hàng
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/bank-accounts — Thêm tài khoản ngân hàng mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bank_name, account_code, account_number, account_holder, branch, is_default } = body;

  if (!bank_name || !account_code || !account_number || !account_holder) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: bank_name, account_code, account_number, account_holder" },
      { status: 400 }
    );
  }

  // Nếu is_default = true, reset tất cả tài khoản khác về false trước
  if (is_default === true) {
    const { error: resetError } = await supabaseAdmin
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("is_default", true);

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }
  }

  const insertData: BankAccountInsert = {
    bank_name,
    account_code,
    account_number,
    account_holder,
    branch: branch ?? null,
    is_default: is_default ?? false,
  };

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
