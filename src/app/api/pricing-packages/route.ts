import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { PricingPackageInsert } from "@/types/database.types";

// GET /api/pricing-packages — Lấy danh sách gói giá
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("pricing_packages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/pricing-packages — Thêm gói giá mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { package_name, subject, subject_id, price, sessions_count, duration_type, print_ticket } = body;

  if (!package_name || !subject || price == null || !sessions_count || !duration_type) {
    return NextResponse.json(
      { error: "Thiếu trường bắt buộc: package_name, subject, price, sessions_count, duration_type" },
      { status: 400 }
    );
  }

  const insertData: PricingPackageInsert = {
    package_name,
    subject,
    subject_id: subject_id ?? null,
    price: parseFloat(price),
    sessions_count: parseInt(sessions_count),
    duration_type,
    print_ticket: print_ticket ?? false,
  };

  const { data, error } = await supabaseAdmin
    .from("pricing_packages")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
