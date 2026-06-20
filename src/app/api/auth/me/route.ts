import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const user = await verifyJWT(token);

  if (!user) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
  });
}
