import { NextResponse } from "next/server";

export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Set cookie session_token hết hạn ngay lập tức
  const cookieString = `session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${
    isProduction ? "; Secure" : ""
  }`;

  const response = NextResponse.json({ success: true, message: "Đăng xuất thành công" });
  response.headers.set("Set-Cookie", cookieString);

  return response;
}
