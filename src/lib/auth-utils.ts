/**
 * Auth Utilities - Hỗ trợ mã hóa mật khẩu và xử lý JWT.
 * Sử dụng Web Crypto API thuần túy tương thích với cả Vercel Edge Runtime (Next.js Middleware).
 */

const JWT_SECRET = process.env.JWT_SECRET || "summer_sports_manager_super_secret_jwt_key_2026";
const PASSWORD_SALT = process.env.PASSWORD_SALT || "summer_sports_manager_salt_hash_password_9988";

/**
 * Mã hóa chuỗi UTF-8 sang dạng Base64Url (hỗ trợ tốt Tiếng Việt và các ký tự đặc biệt)
 */
function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  // Chuyển mảng bytes thành chuỗi nhị phân (binary string)
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  
  // Mã hóa base64 và chuyển thành dạng Base64Url
  return btoa(binString)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Giải mã chuỗi Base64Url về chuỗi UTF-8 gốc (hỗ trợ Tiếng Việt)
 */
function base64UrlDecode(str: string): string {
  // Thay thế các ký tự Base64Url về Base64 tiêu chuẩn
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  
  // Bổ sung padding '=' nếu thiếu
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  
  // Giải mã sang chuỗi nhị phân (binary string)
  const binString = atob(base64);
  
  // Chuyển chuỗi nhị phân về mảng bytes
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  
  // Giải mã mảng bytes thành chuỗi UTF-8
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Mã hóa mật khẩu thành chuỗi hex SHA-256 có Salt
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const saltedPassword = password + PASSWORD_SALT;
  const data = encoder.encode(saltedPassword);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ký số JWT và trả về chuỗi token
 */
export async function signJWT(payload: Record<string, any>, expiresInSeconds: number = 86400): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = { alg: "HS256", typ: "JWT" };
  const extendedPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const base64UrlHeader = base64UrlEncode(JSON.stringify(header));
  const base64UrlPayload = base64UrlEncode(JSON.stringify(extendedPayload));
  const dataToSign = `${base64UrlHeader}.${base64UrlPayload}`;
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(dataToSign)
  );

  const base64UrlSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${dataToSign}.${base64UrlSignature}`;
}

/**
 * Xác thực JWT token và trả về payload nếu hợp lệ, ngược lại trả về null
 */
export async function verifyJWT(token: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const encoder = new TextEncoder();
    
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const dataToVerify = `${header}.${payload}`;

    // Giải mã signature base64url về ArrayBuffer
    const sigStr = atob(signature.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      secretKey,
      sigBytes,
      encoder.encode(dataToVerify)
    );

    if (!isValid) return null;

    // Giải mã payload sử dụng helper hỗ trợ Unicode
    const payloadStr = base64UrlDecode(payload);
    const decodedPayload = JSON.parse(payloadStr);

    // Kiểm tra hết hạn (expiration time)
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return decodedPayload;
  } catch (err) {
    console.error("JWT Verification failed:", err);
    return null;
  }
}
