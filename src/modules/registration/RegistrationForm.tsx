"use client";

import { useState, useEffect } from "react";
import type { School, PricingPackage, PaymentMethod } from "@/types/database.types";
import Modal from "@/components/Modal";

interface RegistrationFormProps {
  onRegistered: () => void;
}

interface RegistrationResult {
  card_code: string;
  students: { full_name: string };
  pricing_packages: { package_name: string; subject: string; price: number };
  remaining_sessions: number;
  amount_paid: number;
  debt_amount: number;
}

export default function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    class_name: "",
    phone_number: "",
    school_id: "",
    other_school_name: "",
    notes: "",
    package_id: "",
    receipt_number: "",
    amount_paid: "",
    payments: [] as Array<{ payment_method_id: string; amount: string }>,
    receipt_images: [] as string[],
  });

  // Fetch schools, packages, and payment methods
  useEffect(() => {
    Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch("/api/pricing-packages").then((r) => r.json()),
      fetch("/api/payment-methods").then((r) => r.json()),
    ]).then(([s, p, pm]) => {
      setSchools(s);
      setPackages(p);
      const activeMethods = pm.filter((m: any) => m.is_active);
      setPaymentMethods(activeMethods);
    });
  }, []);

  // Sync amount_paid and default payments when package is selected
  useEffect(() => {
    const selectedPkg = packages.find((p) => p.id === formData.package_id);
    if (selectedPkg) {
      setFormData((prev) => {
        const priceStr = selectedPkg.price.toString();
        
        // Cập nhật phương thức thanh toán đầu tiên nếu chưa có
        const defaultPayments = prev.payments.length > 0
          ? prev.payments.map((p, idx) => idx === 0 ? { ...p, amount: priceStr } : p)
          : (paymentMethods.length > 0 ? [{ payment_method_id: paymentMethods[0].id, amount: priceStr }] : []);

        return {
          ...prev,
          amount_paid: priceStr,
          payments: defaultPayments,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        amount_paid: "",
        payments: [],
      }));
    }
  }, [formData.package_id, packages, paymentMethods]);

  // Kiểm tra school có phải "Trường khác" (mã 99) không
  const selectedSchool = schools.find((s) => s.id === formData.school_id);
  const isOtherSchool = selectedSchool?.school_code === "99";

  // Lấy gói đã chọn
  const selectedPackage = packages.find((p) => p.id === formData.package_id);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const [isCompressing, setIsCompressing] = useState(false);

  const compressImageToMax60Kb = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let quality = 0.6;
          let scale = 1.0;
          const maxBase64Length = 60 * 1024; // 60KB
          
          const attemptCompression = (): string => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 600 * scale;
            const MAX_HEIGHT = 600 * scale;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            
            return canvas.toDataURL("image/jpeg", quality);
          };

          let resultBase64 = attemptCompression();
          let attempts = 0;
          
          while (resultBase64.length > maxBase64Length && attempts < 5) {
            attempts++;
            scale -= 0.15; // Reduce resolution scale
            quality -= 0.1; // Reduce JPEG quality
            if (quality < 0.2) quality = 0.2;
            if (scale < 0.3) scale = 0.3;
            resultBase64 = attemptCompression();
          }
          
          resolve(resultBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.receipt_images.length;
    const remainingCount = 2 - currentCount;
    if (remainingCount <= 0) {
      alert("Đã đạt giới hạn tối đa 2 ảnh phiếu thu.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCount);
    setIsCompressing(true);
    try {
      const compressedImages: string[] = [];
      for (const file of filesToUpload) {
        const compressedBase64 = await compressImageToMax60Kb(file);
        compressedImages.push(compressedBase64);
      }
      setFormData(prev => ({
        ...prev,
        receipt_images: [...prev.receipt_images, ...compressedImages]
      }));
    } catch (err) {
      console.error("Error compressing image:", err);
      alert("Không thể nén và xử lý hình ảnh.");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (indexToDelete: number) => {
    setFormData(prev => ({
      ...prev,
      receipt_images: prev.receipt_images.filter((_, idx) => idx !== indexToDelete)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.full_name ||
      !formData.dob ||
      !formData.gender ||
      !formData.phone_number ||
      !formData.school_id ||
      !formData.package_id ||
      !formData.receipt_number
    ) {
      setError("Vui lòng điền đầy đủ các thông tin có dấu *.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError("Số điện thoại phụ huynh phải bao gồm đúng 10 chữ số.");
      return;
    }

    if (isOtherSchool && (!formData.other_school_name || !formData.notes)) {
      setError("Khi chọn 'Trường khác', bắt buộc điền 'Tên trường khác' và 'Ghi chú'.");
      return;
    }

    // Kiểm tra số tiền trả và phối hợp thanh toán
    const totalPaid = Number(formData.amount_paid) || 0;
    if (totalPaid < 0) {
      setError("Số tiền thanh toán không được nhỏ hơn 0.");
      return;
    }

    const pkgPrice = selectedPackage?.price || 0;
    if (totalPaid > pkgPrice) {
      setError(`Số tiền thanh toán (${formatPrice(totalPaid)}) không được vượt quá giá trị gói học (${formatPrice(pkgPrice)}).`);
      return;
    }

    if (totalPaid > 0) {
      if (formData.payments.length === 0) {
        setError("Vui lòng chọn ít nhất một phương thức thanh toán phối hợp.");
        return;
      }

      for (const p of formData.payments) {
        if (!p.payment_method_id) {
          setError("Vui lòng chọn phương thức thanh toán.");
          return;
        }
        if (Number(p.amount) <= 0) {
          setError("Số tiền của mỗi phương thức thanh toán phải lớn hơn 0.");
          return;
        }
      }

      const sumPayments = formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (Math.abs(sumPayments - totalPaid) > 0.01) {
        setError(
          `Tổng số tiền của các phương thức thanh toán (${formatPrice(sumPayments)}) phải bằng số tiền thanh toán thực tế (${formatPrice(totalPaid)}).`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount_paid: totalPaid,
          payments: formData.payments.map((p) => ({
            payment_method_id: p.payment_method_id,
            amount: Number(p.amount),
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      setResult(data);
      setShowResult(true);
      setFormData({
        full_name: "",
        dob: "",
        gender: "",
        class_name: "",
        phone_number: "",
        school_id: "",
        other_school_name: "",
        notes: "",
        package_id: "",
        receipt_number: "",
        amount_paid: "",
        payments: [],
        receipt_images: [],
      });
      onRegistered();
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📝 Form Ghi danh học viên mới</h3>
        </div>
        <div style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            {/* Họ tên */}
            <div className="form-group">
              <label className="form-label">Họ tên học viên *</label>
              <input
                className="form-input"
                placeholder="VD: Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            {/* Ngày sinh + Giới tính */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Giới tính *</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">— Chọn giới tính —</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            {/* Lớp + SĐT */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lớp</label>
                <input
                  className="form-input"
                  placeholder="VD: 10A1"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại phụ huynh *</label>
                <input
                  className="form-input"
                  placeholder="VD: 0901234567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>

            {/* Trường học */}
            <div className="form-group">
              <label className="form-label">Trường học *</label>
              <select
                className="form-select"
                value={formData.school_id}
                onChange={(e) =>
                  setFormData({ ...formData, school_id: e.target.value, other_school_name: "", notes: "" })
                }
              >
                <option value="">— Chọn trường —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.school_code}] {s.school_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trường khác - hiện khi chọn mã 99 */}
            {isOtherSchool && (
              <div className="other-school-section">
                <div className="form-group">
                  <label className="form-label">Tên trường khác *</label>
                  <input
                    className="form-input"
                    placeholder="VD: THPT Lê Hồng Phong"
                    value={formData.other_school_name}
                    onChange={(e) => setFormData({ ...formData, other_school_name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div className="form-group">
              <label className="form-label">Ghi chú {isOtherSchool ? "(học chung với ai) *" : "(không bắt buộc)"}</label>
              <input
                className="form-input"
                placeholder="Nhập ghi chú thêm..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Gói học + Giá */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gói học *</label>
                <select
                  className="form-select"
                  value={formData.package_id}
                  onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                >
                  <option value="">— Chọn gói —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.package_name} ({p.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Giá gói (tự động)</label>
                <div className="price-display">
                  {selectedPackage ? (
                    <>
                      <span className="price-value">{formatPrice(selectedPackage.price)}</span>
                      <span className="price-sessions">{selectedPackage.sessions_count} buổi</span>
                    </>
                  ) : (
                    <span className="price-placeholder">Chọn gói để xem giá</span>
                  )}
                </div>
              </div>
            </div>

            {/* Số tiền đóng thực tế + Công nợ */}
            {selectedPackage && (
              <div className="form-row" style={{ marginTop: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Số tiền đóng thực tế (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Nhập số tiền thực trả..."
                    value={formData.amount_paid}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => {
                        const updatedPayments = prev.payments.length === 1
                          ? [{ ...prev.payments[0], amount: val }]
                          : prev.payments;
                        return { ...prev, amount_paid: val, payments: updatedPayments };
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Công nợ ghi nhận</label>
                  <div
                    className="price-display"
                    style={{
                      background: "rgba(244, 63, 94, 0.05)",
                      border: "1px dashed rgba(244, 63, 94, 0.2)",
                    }}
                  >
                    <span className="price-value" style={{ color: "var(--accent-rose)" }}>
                      {formatPrice(Math.max(0, (selectedPackage?.price || 0) - (Number(formData.amount_paid) || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Thanh toán phối hợp */}
            {selectedPackage && (Number(formData.amount_paid) || 0) > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  background: "var(--bg-glass-hover)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <label
                  className="form-label"
                  style={{
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span>🔗 Phương thức thanh toán phối hợp</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        payments: [
                          ...prev.payments,
                          { payment_method_id: paymentMethods[0]?.id || "", amount: "" },
                        ],
                      }));
                    }}
                    style={{ padding: "4px 8px", fontSize: "12px", border: "1px solid var(--border-color)" }}
                  >
                    ➕ Thêm phương thức
                  </button>
                </label>

                {formData.payments.map((payment, idx) => (
                  <div key={idx} className="form-row" style={{ marginBottom: "10px", alignItems: "center" }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <select
                        className="form-select"
                        value={payment.payment_method_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            payments: prev.payments.map((p, i) =>
                              i === idx ? { ...p, payment_method_id: val } : p
                            ),
                          }));
                        }}
                      >
                        <option value="">— Chọn hình thức —</option>
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.method_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Số tiền..."
                        value={payment.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            payments: prev.payments.map((p, i) => (i === idx ? { ...p, amount: val } : p)),
                          }));
                        }}
                      />
                    </div>
                    {formData.payments.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            payments: prev.payments.filter((_, i) => i !== idx),
                          }));
                        }}
                        style={{
                          color: "var(--accent-rose)",
                          padding: "8px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}

                {/* Kiểm tra khớp tổng tiền */}
                {(() => {
                  const totalPaid = Number(formData.amount_paid) || 0;
                  const sumPayments = formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                  const diff = Math.abs(sumPayments - totalPaid);
                  if (diff > 0.01) {
                    return (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--accent-amber)",
                          marginTop: "8px",
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        ⚠️ Tổng phân bổ ({formatPrice(sumPayments)}) chưa khớp số tiền đóng ({formatPrice(totalPaid)}).
                        Lệch: {formatPrice(diff)}
                      </div>
                    );
                  }
                  return (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--accent-emerald-light)",
                        marginTop: "8px",
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      ✅ Đã khớp tổng tiền ({formatPrice(sumPayments)})
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Số phiếu thu */}
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">Số phiếu thu *</label>
              <input
                className="form-input"
                placeholder="VD: PT00123"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              />
            </div>

            {/* Ảnh phiếu thu */}
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Ảnh phiếu thu (Tối đa 2 ảnh)</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {formData.receipt_images.length}/2 ảnh
                </span>
              </label>
              
              {formData.receipt_images.length < 2 && (
                <div style={{ position: "relative" }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isCompressing}
                    style={{ display: "none" }}
                    id="receipt-images-upload"
                  />
                  <label
                    htmlFor="receipt-images-upload"
                    className="btn btn-ghost"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      padding: "10px",
                      border: "1px dashed var(--border-color)",
                      borderRadius: "6px",
                      cursor: isCompressing ? "not-allowed" : "pointer",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    {isCompressing ? (
                      <>
                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                        Đang nén ảnh...
                      </>
                    ) : (
                      <>📸 Tải lên ảnh phiếu thu</>
                    )}
                  </label>
                </div>
              )}

              {formData.receipt_images.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                  {formData.receipt_images.map((imgBase64, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        position: "relative", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: "6px", 
                        padding: "4px", 
                        background: "var(--bg-card)" 
                      }}
                    >
                      <img 
                        src={imgBase64} 
                        alt={`Phiếu thu ${index + 1}`} 
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          background: "var(--accent-rose)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Đang xử lý...
                </>
              ) : (
                "📝 Ghi danh"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal kết quả */}
      <Modal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        title="✅ Ghi danh thành công!"
        footer={
          <button className="btn btn-primary" onClick={() => setShowResult(false)}>
            Đóng
          </button>
        }
      >
        {result && (
          <div className="result-card">
            <div className="result-card-code">{result.card_code}</div>
            <div className="result-label">Mã thẻ học viên</div>
            <div className="result-details">
              <div className="result-row">
                <span>Học viên</span>
                <strong>{result.students?.full_name}</strong>
              </div>
              <div className="result-row">
                <span>Gói học</span>
                <strong>{result.pricing_packages?.package_name}</strong>
              </div>
              <div className="result-row">
                <span>Môn</span>
                <strong>{result.pricing_packages?.subject}</strong>
              </div>
              <div className="result-row">
                <span>Giá gói</span>
                <strong className="price">{formatPrice(result.pricing_packages?.price || 0)}</strong>
              </div>
              <div className="result-row">
                <span>Đã đóng</span>
                <strong className="price" style={{ color: "var(--accent-emerald-light)" }}>
                  {formatPrice(result.amount_paid)}
                </strong>
              </div>
              <div className="result-row">
                <span>Công nợ</span>
                <strong style={{ color: "var(--accent-rose)" }}>{formatPrice(result.debt_amount)}</strong>
              </div>
              <div className="result-row">
                <span>Số buổi</span>
                <strong>{result.remaining_sessions} buổi</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
