import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { SchoolInsert } from "@/types/database.types";

// GET /api/schools — Lấy danh sách trường học
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("*")
    .order("school_code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/schools — Thêm trường mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { school_name, school_code } = body;

  if (!school_name || !school_code) {
    return NextResponse.json(
      { error: "school_name và school_code là bắt buộc" },
      { status: 400 }
    );
  }

  const insertData: SchoolInsert = { school_name, school_code };

  const { data, error } = await supabaseAdmin
    .from("schools")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
