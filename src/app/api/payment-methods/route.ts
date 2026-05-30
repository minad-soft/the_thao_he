import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { PaymentMethodInsert } from "@/types/database.types";

// GET /api/payment-methods — Lấy danh sách phương thức thanh toán
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/payment-methods — Thêm phương thức thanh toán mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { method_name, description, is_active } = body;

  if (!method_name) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: method_name" },
      { status: 400 }
    );
  }

  const insertData: PaymentMethodInsert = {
    method_name,
    description: description ?? null,
    is_active: is_active ?? true,
  };

  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
