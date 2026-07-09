import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("student_portal_token");
  
  return NextResponse.json({ message: "Đăng xuất thành công" });
}
