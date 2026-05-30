import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// PUT /api/staffs/[id] — Cập nhật thông tin nhân viên
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, username, phone_number, role, password, status } = body;

    // Validation cơ bản
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Họ tên không được để trống" }, { status: 400 });
    }
    if (!role || !["ADMIN", "STAFF", "ACCOUNTANT"].includes(role)) {
      return NextResponse.json({ error: "Phân quyền không hợp lệ" }, { status: 400 });
    }
    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    // Nếu username thay đổi, kiểm tra trùng lặp
    if (username?.trim()) {
      const { data: existingStaff, error: checkError } = await supabaseAdmin
        .from("staffs")
        .select("id")
        .eq("username", username.trim())
        .neq("id", id)
        .maybeSingle();

      if (checkError) {
        return NextResponse.json({ error: checkError.message }, { status: 500 });
      }

      if (existingStaff) {
        return NextResponse.json({ error: "Tên đăng nhập đã tồn tại trên hệ thống" }, { status: 409 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      full_name: full_name.trim(),
      phone_number: phone_number?.trim() || null,
      role: role,
      status: status,
    };

    if (username?.trim()) {
      updateData.username = username.trim();
    }

    // Chỉ cập nhật mật khẩu nếu có nhập mật khẩu mới
    if (password && password.trim() !== "") {
      updateData.password = password;
    }

    const { data, error } = await supabaseAdmin
      .from("staffs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 500 });
  }
}

// DELETE /api/staffs/[id] — Xóa nhân viên
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("staffs")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 500 });
  }
}
