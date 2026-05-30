import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { SubjectInsert } from "@/types/database.types";

// GET /api/subjects — Lấy danh sách môn học
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("subjects")
    .select("*")
    .order("subject_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/subjects — Thêm môn học mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { subject_name, description, icon } = body;

  if (!subject_name) {
    return NextResponse.json(
      { error: "subject_name là bắt buộc" },
      { status: 400 }
    );
  }

  const insertData: SubjectInsert = {
    subject_name,
    description: description ?? null,
    icon: icon ?? "🏀",
  };

  const { data, error } = await supabaseAdmin
    .from("subjects")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
