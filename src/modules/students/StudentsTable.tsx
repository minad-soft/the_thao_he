"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { PaymentMethod } from "@/types/database.types";

interface StudentRecord {
  id: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  class_name: string | null;
  phone_number: string | null;
  school_id: string | null;
  other_school_name: string | null;
  notes: string | null;
  created_at: string;
  schools: { school_name: string; school_code: string } | null;
  registrations: Array<{
    id: string;
    card_code: string;
    status: string;
    remaining_sessions: number;
    is_card_issued: boolean;
    card_reissue_count: number;
    receipt_number: string | null;
    payment_method_id: string | null;
    package_id: string | null;
    amount_paid: number;
    debt_amount: number;
    cancelled_at: string | null;
    refund_amount: number | null;
    refund_method: string | null;
    refund_receipt_image: string | null;
    cancellation_notes: string | null;
    receipt_images?: string[] | null;
    payment_methods: { method_name: string } | null;
    pricing_packages: { package_name: string; subject: string; price: number } | null;
    registration_payments: Array<{
      id: string;
      payment_method_id: string | null;
      amount: number;
      payment_methods: { method_name: string } | null;
    }>;
  }>;
}

interface StudentsTableProps {
  students: StudentRecord[];
  schools?: any[];
  packages?: any[];
  paymentMethods?: PaymentMethod[];
  onRefresh?: () => void;
  onStudentUpdated: (student: Partial<StudentRecord>) => void;
  onStudentDeleted: (id: string) => void;
}

export default function StudentsTable({ 
  students, 
  schools = [], 
  packages = [], 
  paymentMethods = [], 
  onRefresh,
  onStudentUpdated, 
  onStudentDeleted 
}: StudentsTableProps) {
  // Edit Student Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    full_name: "", 
    phone_number: "", 
    dob: "", 
    gender: "",
    class_name: "", 
    school_id: "", 
    other_school_name: "", 
    notes: "",
    package_id: "", 
    receipt_number: "", 
    amount_paid: "",
    payments: [] as Array<{ payment_method_id: string; amount: string }>,
    status: "ACTIVE",
    remaining_sessions: 0,
    registration_id: "",
    is_card_issued: false,
    card_reissue_count: 0
  });
  const [error, setError] = useState("");

  // Reissue Card Modal States
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false);
  const [reissueRegId, setReissueRegId] = useState<string | null>(null);
  const [newCardCode, setNewCardCode] = useState("");
  const [isReissuing, setIsReissuing] = useState(false);
  const [reissueError, setReissueError] = useState("");

  // Pay Debt Modal States (Tất toán công nợ)
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [isPayDebtSubmitting, setIsPayDebtSubmitting] = useState(false);
  const [payDebtError, setPayDebtError] = useState("");
  const [payDebtRegId, setPayDebtRegId] = useState<string | null>(null);
  const [payDebtInfo, setPayDebtInfo] = useState({
    studentName: "",
    packageName: "",
    currentDebt: 0
  });
  const [payDebtFormData, setPayDebtFormData] = useState({
    amount_to_pay: "",
    receipt_number: "",
    payments: [] as Array<{ payment_method_id: string; amount: string }>,
  });

  // Cancel Registration Modal States (Hủy đăng ký)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelRegId, setCancelRegId] = useState<string | null>(null);
  const [cancelInfo, setCancelInfo] = useState({
    studentName: "",
    packageName: "",
    remainingSessions: 0,
    amountPaid: 0
  });
  const [cancelFormData, setCancelFormData] = useState({
    isRefund: false,
    refund_amount: "",
    refund_method: "",
    refund_receipt_image: "" as string,
    cancellation_notes: "",
  });

  // Student Details Modal States (Xem chi tiết học viên)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<StudentRecord | null>(null);
  const [isDetailsImageUploading, setIsDetailsImageUploading] = useState(false);

  // Bill Viewer Light-box States (Phóng to hóa đơn hoàn tiền)
  const [isBillViewerOpen, setIsBillViewerOpen] = useState(false);
  const [billViewerUrl, setBillViewerUrl] = useState("");

  // Column visibility state
  const availableColumns = [
    { id: "full_name", label: "Họ tên" },
    { id: "dob", label: "Ngày sinh" },
    { id: "gender", label: "Giới tính" },
    { id: "class_name", label: "Lớp" },
    { id: "phone_number", label: "SĐT" },
    { id: "school", label: "Trường" },
    { id: "notes", label: "Ghi chú" },
    { id: "card_code", label: "Mã thẻ" },
    { id: "package", label: "Gói học" },
    { id: "price", label: "Giá gói" },
    { id: "amount_paid", label: "Đã đóng" },
    { id: "debt_amount", label: "Công nợ" },
    { id: "remaining", label: "Số buổi" },
    { id: "receipt_number", label: "Số phiếu thu" },
    { id: "payment_method", label: "Thanh toán" },
    { id: "card_issued", label: "Cấp thẻ" },
    { id: "status", label: "Trạng thái" },
    { id: "created_at", label: "Ngày ĐK" },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    full_name: true,
    dob: false,
    gender: false,
    class_name: false,
    phone_number: true,
    school: true,
    notes: false,
    card_code: true,
    package: true,
    price: true,
    amount_paid: false,
    debt_amount: false,
    remaining: true,
    receipt_number: false,
    payment_method: true,
    card_issued: true,
    status: true,
    created_at: false,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  // Details Modal Handlers
  const handleOpenDetails = (student: StudentRecord) => {
    setDetailsStudent(student);
    setIsDetailsModalOpen(true);
  };

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

  const handleUploadReceiptImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailsStudent) return;
    const reg = detailsStudent.registrations?.[0];
    if (!reg) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = reg.receipt_images || [];
    const currentCount = currentImages.length;
    const remainingCount = 2 - currentCount;
    if (remainingCount <= 0) {
      alert("Đã đạt giới hạn tối đa 2 ảnh phiếu thu.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCount);
    setIsDetailsImageUploading(true);
    try {
      const compressedImages: string[] = [];
      for (const file of filesToUpload) {
        const compressedBase64 = await compressImageToMax60Kb(file);
        compressedImages.push(compressedBase64);
      }
      
      const updatedImages = [...currentImages, ...compressedImages];
      
      const res = await fetch(`/api/registrations/${reg.id}/receipt-images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_images: updatedImages })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Không thể cập nhật ảnh phiếu thu.");
        return;
      }

      const updatedReg = { ...reg, receipt_images: updatedImages };
      const updatedStudent = {
        ...detailsStudent,
        registrations: [updatedReg, ...(detailsStudent.registrations || []).slice(1)]
      };
      setDetailsStudent(updatedStudent);
      
      if (onRefresh) onRefresh();
      alert("Đã bổ sung ảnh phiếu thu thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xử lý hình ảnh.");
    } finally {
      setIsDetailsImageUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteReceiptImage = async (imgIndex: number) => {
    if (!detailsStudent) return;
    const reg = detailsStudent.registrations?.[0];
    if (!reg) return;

    if (!confirm("Bạn có chắc chắn muốn xóa ảnh phiếu thu này?")) return;

    const currentImages = reg.receipt_images || [];
    const updatedImages = currentImages.filter((_, idx) => idx !== imgIndex);

    try {
      const res = await fetch(`/api/registrations/${reg.id}/receipt-images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_images: updatedImages })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Không thể xóa ảnh phiếu thu.");
        return;
      }

      const updatedReg = { ...reg, receipt_images: updatedImages };
      const updatedStudent = {
        ...detailsStudent,
        registrations: [updatedReg, ...(detailsStudent.registrations || []).slice(1)]
      };
      setDetailsStudent(updatedStudent);

      if (onRefresh) onRefresh();
      alert("Đã xóa ảnh phiếu thu thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi xóa ảnh.");
    }
  };

  const handleEditFromDetails = () => {
    if (!detailsStudent) return;
    setIsDetailsModalOpen(false);
    handleOpenEdit(detailsStudent);
  };

  const handleCancelFromDetails = () => {
    if (!detailsStudent) return;
    setIsDetailsModalOpen(false);
    handleOpenCancel(detailsStudent);
  };

  const handlePayDebtFromDetails = () => {
    if (!detailsStudent) return;
    setIsDetailsModalOpen(false);
    handleOpenPayDebt(detailsStudent);
  };

  const handleDeleteFromDetails = () => {
    if (!detailsStudent) return;
    setIsDetailsModalOpen(false);
    handleDelete(detailsStudent.id, detailsStudent.full_name);
  };

  // Edit Handlers
  const handleOpenEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    const reg = student.registrations?.[0];
    
    const mappedPayments = reg?.registration_payments && reg.registration_payments.length > 0
      ? reg.registration_payments.map(p => ({
          payment_method_id: p.payment_method_id || "",
          amount: p.amount.toString(),
        }))
      : (reg?.payment_method_id 
          ? [{ payment_method_id: reg.payment_method_id, amount: (reg.amount_paid || 0).toString() }]
          : []);

    setFormData({
      full_name: student.full_name || "",
      phone_number: student.phone_number || "",
      dob: student.dob || "",
      gender: student.gender || "",
      class_name: student.class_name || "",
      school_id: student.school_id || "",
      other_school_name: student.other_school_name || "",
      notes: student.notes || "",
      package_id: reg?.package_id || "",
      receipt_number: reg?.receipt_number || "",
      amount_paid: reg ? (reg.amount_paid !== undefined ? reg.amount_paid.toString() : (reg.pricing_packages?.price || 0).toString()) : "0",
      payments: mappedPayments,
      status: reg?.status || "ACTIVE",
      remaining_sessions: reg?.remaining_sessions || 0,
      registration_id: reg?.id || "",
      is_card_issued: reg?.is_card_issued || false,
      card_reissue_count: reg?.card_reissue_count || 0,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học viên "${name}"? Thao tác này sẽ xóa mọi dữ liệu check-in và ghi danh của học viên này!`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        onStudentDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa học viên: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.full_name.trim()) {
      setError("Vui lòng điền tên học viên.");
      return;
    }
    if (!formData.dob) {
      setError("Vui lòng điền ngày sinh.");
      return;
    }
    if (!formData.gender) {
      setError("Vui lòng chọn giới tính học viên.");
      return;
    }
    if (!formData.phone_number.trim()) {
      setError("Vui lòng điền số điện thoại phụ huynh.");
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError("Số điện thoại phụ huynh phải bao gồm đúng 10 chữ số.");
      return;
    }
    if (!formData.school_id) {
      setError("Vui lòng chọn trường học.");
      return;
    }
    if (!formData.package_id) {
      setError("Vui lòng chọn gói học.");
      return;
    }
    if (!formData.receipt_number.trim()) {
      setError("Vui lòng nhập số phiếu thu.");
      return;
    }

    const totalPaid = Number(formData.amount_paid) || 0;
    if (totalPaid < 0) {
      setError("Số tiền thanh toán không được âm.");
      return;
    }

    const selectedPkg = packages.find(p => p.id === formData.package_id);
    const pkgPrice = selectedPkg?.price || 0;
    if (totalPaid > pkgPrice) {
      setError(`Số tiền thanh toán (${formatPrice(totalPaid)}) vượt quá giá trị gói học (${formatPrice(pkgPrice)}).`);
      return;
    }

    if (totalPaid > 0) {
      if (formData.payments.length === 0) {
        setError("Vui lòng chọn ít nhất một phương thức thanh toán.");
        return;
      }
      for (const p of formData.payments) {
        if (!p.payment_method_id) {
          setError("Vui lòng chọn đầy đủ phương thức thanh toán.");
          return;
        }
        if (Number(p.amount) <= 0) {
          setError("Số tiền thanh toán ở mỗi phương thức phải lớn hơn 0.");
          return;
        }
      }
      const sumPayments = formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (Math.abs(sumPayments - totalPaid) > 0.01) {
        setError(`Tổng tiền phân bổ của các phương thức (${formatPrice(sumPayments)}) phải khớp với số tiền thực đóng (${formatPrice(totalPaid)}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/students/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount_paid: totalPaid,
          payments: formData.payments.map(p => ({
            payment_method_id: p.payment_method_id,
            amount: Number(p.amount)
          }))
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (onRefresh) {
        onRefresh();
      } else {
        onStudentUpdated({
          id: editingId as string,
          full_name: data.full_name,
          phone_number: data.phone_number,
        });
      }
      
      setIsModalOpen(false);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pay Debt Handlers
  const handleOpenPayDebt = (student: StudentRecord) => {
    const reg = student.registrations?.[0];
    if (!reg) return;

    setPayDebtRegId(reg.id);
    setPayDebtInfo({
      studentName: student.full_name,
      packageName: reg.pricing_packages?.package_name || "Gói học",
      currentDebt: reg.debt_amount || 0
    });
    
    const debtStr = (reg.debt_amount || 0).toString();
    setPayDebtFormData({
      amount_to_pay: debtStr,
      receipt_number: "",
      payments: paymentMethods.length > 0 
        ? [{ payment_method_id: paymentMethods[0].id, amount: debtStr }]
        : []
    });
    setPayDebtError("");
    setIsPayDebtModalOpen(true);
  };

  const handlePayDebtSubmit = async () => {
    setPayDebtError("");
    const payAmount = Number(payDebtFormData.amount_to_pay) || 0;
    
    if (payAmount <= 0) {
      setPayDebtError("Số tiền đóng thêm phải lớn hơn 0.");
      return;
    }
    if (payAmount > payDebtInfo.currentDebt) {
      setPayDebtError(`Số tiền đóng thêm không được vượt quá số nợ hiện tại (${formatPrice(payDebtInfo.currentDebt)}).`);
      return;
    }
    if (!payDebtFormData.receipt_number.trim()) {
      setPayDebtError("Vui lòng nhập số phiếu thu mới.");
      return;
    }

    if (payDebtFormData.payments.length === 0) {
      setPayDebtError("Vui lòng chọn ít nhất một phương thức thanh toán.");
      return;
    }
    for (const p of payDebtFormData.payments) {
      if (!p.payment_method_id) {
        setPayDebtError("Vui lòng chọn đầy đủ phương thức thanh toán.");
        return;
      }
      if (Number(p.amount) <= 0) {
        setPayDebtError("Số tiền thanh toán ở mỗi phương thức phải lớn hơn 0.");
        return;
      }
    }
    const sumPayments = payDebtFormData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (Math.abs(sumPayments - payAmount) > 0.01) {
      setPayDebtError(`Tổng tiền của các phương thức (${formatPrice(sumPayments)}) phải khớp với số tiền thực đóng (${formatPrice(payAmount)}).`);
      return;
    }

    setIsPayDebtSubmitting(true);
    try {
      const res = await fetch(`/api/registrations/${payDebtRegId}/pay-debt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_to_pay: payAmount,
          receipt_number: payDebtFormData.receipt_number.trim(),
          payments: payDebtFormData.payments.map(p => ({
            payment_method_id: p.payment_method_id,
            amount: Number(p.amount)
          }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setPayDebtError(data.error || "Lỗi khi lưu thông tin");
        return;
      }

      alert("Tất toán công nợ thành công!");
      setIsPayDebtModalOpen(false);
      if (onRefresh) onRefresh();
    } catch {
      setPayDebtError("Không thể kết nối server");
    } finally {
      setIsPayDebtSubmitting(false);
    }
  };

  // Cancellation Handlers
  const handleOpenCancel = (student: StudentRecord) => {
    const reg = student.registrations?.[0];
    if (!reg) return;

    setCancelRegId(reg.id);
    setCancelInfo({
      studentName: student.full_name,
      packageName: reg.pricing_packages?.package_name || "Gói học",
      remainingSessions: reg.remaining_sessions || 0,
      amountPaid: reg.amount_paid || 0
    });
    
    setCancelFormData({
      isRefund: false,
      refund_amount: (reg.amount_paid || 0).toString(),
      refund_method: paymentMethods[0]?.id || "",
      refund_receipt_image: "",
      cancellation_notes: ""
    });
    setCancelError("");
    setIsCancelModalOpen(true);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setCancelFormData(prev => ({ ...prev, refund_receipt_image: base64 }));
    } catch (err) {
      alert("Lỗi xử lý hình ảnh: " + err);
    }
  };

  const handleCancelSubmit = async () => {
    setCancelError("");
    const refundAmt = Number(cancelFormData.refund_amount) || 0;

    if (cancelFormData.isRefund) {
      if (refundAmt < 0) {
        setCancelError("Số tiền hoàn trả không được nhỏ hơn 0.");
        return;
      }
      if (refundAmt > cancelInfo.amountPaid) {
        setCancelError(`Số tiền hoàn trả (${formatPrice(refundAmt)}) không được lớn hơn số tiền đã đóng (${formatPrice(cancelInfo.amountPaid)}).`);
        return;
      }
      if (!cancelFormData.refund_method) {
        setCancelError("Vui lòng chọn hình thức hoàn tiền.");
        return;
      }
      if (!cancelFormData.refund_receipt_image) {
        setCancelError("Vui lòng upload ảnh chứng từ hoàn tiền.");
        return;
      }
    }
    if (!cancelFormData.cancellation_notes.trim()) {
      setCancelError("Vui lòng nhập lý do/ghi chú hủy đăng ký.");
      return;
    }

    setIsCancelSubmitting(true);
    try {
      const selectedMethodName = paymentMethods.find(pm => pm.id === cancelFormData.refund_method)?.method_name || "Khác";
      
      const res = await fetch(`/api/registrations/${cancelRegId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refund_amount: cancelFormData.isRefund ? refundAmt : 0,
          refund_method: cancelFormData.isRefund ? selectedMethodName : null,
          refund_receipt_image: cancelFormData.isRefund ? cancelFormData.refund_receipt_image : null,
          cancellation_notes: cancelFormData.cancellation_notes.trim()
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Lỗi khi hủy đăng ký");
        return;
      }

      alert("Đã hủy đăng ký học viên thành công!");
      setIsCancelModalOpen(false);
      if (onRefresh) onRefresh();
    } catch {
      setCancelError("Không thể kết nối server");
    } finally {
      setIsCancelSubmitting(false);
    }
  };

  const handleIssueCard = async (regId: string, studentId: string) => {
    if (!confirm("Xác nhận đã phát thẻ nhựa cho học viên?")) return;
    try {
      const res = await fetch(`/api/registrations/${regId}/issue-card`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Đã cập nhật trạng thái cấp thẻ!");
        if (onRefresh) onRefresh();
        setFormData(prev => ({ ...prev, is_card_issued: true }));
      } else {
        alert("Lỗi khi cập nhật trạng thái");
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleOpenReissue = (regId: string) => {
    setReissueRegId(regId);
    setNewCardCode("");
    setReissueError("");
    setIsReissueModalOpen(true);
  };

  const handleSubmitReissue = async () => {
    setReissueError("");
    if (!newCardCode.trim()) {
      setReissueError("Vui lòng nhập mã thẻ mới.");
      return;
    }

    setIsReissuing(true);
    try {
      const res = await fetch(`/api/registrations/${reissueRegId}/reissue-card`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_card_code: newCardCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReissueError(data.error || "Có lỗi xảy ra");
        return;
      }

      alert("Đã cấp lại thẻ thành công!");
      setIsReissueModalOpen(false);
      if (onRefresh) onRefresh();
      setFormData(prev => ({ ...prev, card_reissue_count: prev.card_reissue_count + 1 }));
    } catch {
      setReissueError("Không thể kết nối server");
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <>
      <div className="card" style={{ overflow: "visible" }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">👥 Danh sách Học viên ({students.length})</h3>
          <div className="column-toggle" style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Ẩn/hiện cột
            </button>
            {showColumnMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, zIndex: 9999, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.8)', marginTop: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                 {availableColumns.map(col => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[col.id]} 
                        onChange={() => toggleColumn(col.id)} 
                        style={{ accentColor: 'var(--accent-indigo)' }}
                      />
                      {col.label}
                    </label>
                 ))}
                 <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowColumnMenu(false)} style={{ fontSize: 11, padding: "2px 8px" }}>Đóng</button>
                 </div>
              </div>
            )}
          </div>
        </div>
        <div className="card-body" style={{ overflowX: "auto" }}>
          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">Chưa có học viên nào. Hãy ghi danh hoặc import Excel.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {visibleColumns.full_name && <th>Họ tên</th>}
                  {visibleColumns.dob && <th>Ngày sinh</th>}
                  {visibleColumns.gender && <th>Giới tính</th>}
                  {visibleColumns.class_name && <th>Lớp</th>}
                  {visibleColumns.phone_number && <th>SĐT</th>}
                  {visibleColumns.school && <th>Trường</th>}
                  {visibleColumns.notes && <th>Ghi chú</th>}
                  {visibleColumns.card_code && <th>Mã thẻ</th>}
                  {visibleColumns.package && <th>Gói học</th>}
                  {visibleColumns.price && <th>Giá gói</th>}
                  {visibleColumns.amount_paid && <th>Đã đóng</th>}
                  {visibleColumns.debt_amount && <th>Công nợ</th>}
                  {visibleColumns.remaining && <th>Số buổi</th>}
                  {visibleColumns.receipt_number && <th>Số phiếu thu</th>}
                  {visibleColumns.payment_method && <th>Thanh toán</th>}
                  {visibleColumns.card_issued && <th>Cấp thẻ</th>}
                  {visibleColumns.status && <th>Trạng thái</th>}
                  {visibleColumns.created_at && <th>Ngày ĐK</th>}
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const reg = student.registrations?.[0];
                  return (
                    <tr key={student.id}>
                      {visibleColumns.full_name && (
                        <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(student)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--accent-indigo-light)",
                              cursor: "pointer",
                              fontWeight: 500,
                              padding: 0,
                              textAlign: "left",
                              textDecoration: "underline",
                              fontSize: "inherit",
                              fontFamily: "inherit"
                            }}
                          >
                            {student.full_name}
                          </button>
                        </td>
                      )}
                      {visibleColumns.dob && (
                        <td>{student.dob ? new Date(student.dob).toLocaleDateString("vi-VN") : "—"}</td>
                      )}
                      {visibleColumns.gender && (
                        <td>
                          {student.gender ? (
                            <span className={`badge ${student.gender === "Nam" ? "badge-indigo" : student.gender === "Nữ" ? "badge-rose" : "badge-slate"}`}>
                              {student.gender}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.class_name && <td>{student.class_name || "—"}</td>}
                      {visibleColumns.phone_number && <td>{student.phone_number || "—"}</td>}
                      {visibleColumns.school && (
                        <td>
                          {student.schools ? (
                            <span className="badge badge-indigo">
                              [{student.schools.school_code}] {student.schools.school_name}
                            </span>
                          ) : student.other_school_name ? (
                            <span className="badge badge-amber">{student.other_school_name}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {visibleColumns.notes && <td>{student.notes || "—"}</td>}
                      {visibleColumns.card_code && (
                        <td>
                          {reg ? (
                            <span style={{
                              fontFamily: "'Courier New', monospace",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "var(--accent-indigo-light)",
                              background: "rgba(99, 102, 241, 0.1)",
                              padding: "3px 8px",
                              borderRadius: 4,
                              letterSpacing: "0.04em",
                            }}>
                              {reg.card_code}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.package && (
                        <td>
                          {reg?.pricing_packages ? (
                            <>
                              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                                {reg.pricing_packages.package_name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {reg.pricing_packages.subject}
                              </div>
                            </>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.price && (
                        <td>
                          {reg?.pricing_packages ? (
                            <span className="price">{formatPrice(reg.pricing_packages.price)}</span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.amount_paid && (
                        <td>
                          {reg ? (
                            <span className="price" style={{ color: "var(--accent-emerald-light)" }}>
                              {formatPrice(reg.amount_paid)}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.debt_amount && (
                        <td>
                          {reg ? (
                            <span style={{ 
                              color: reg.debt_amount > 0 ? "var(--accent-rose)" : "var(--text-muted)", 
                              fontWeight: reg.debt_amount > 0 ? 600 : 400 
                            }}>
                              {formatPrice(reg.debt_amount)}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.remaining && (
                        <td>
                          {reg ? (
                            <span style={{ fontWeight: 600, color: "var(--accent-emerald-light)" }}>
                              {reg.remaining_sessions} buổi
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.receipt_number && (
                        <td>{reg?.receipt_number || "—"}</td>
                      )}
                      {visibleColumns.payment_method && (
                        <td>
                          {reg?.registration_payments && reg.registration_payments.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {reg.registration_payments.map((p, pIdx) => (
                                <span 
                                  key={pIdx} 
                                  className="badge" 
                                  style={{ 
                                    display: "block", 
                                    background: "rgba(255,255,255,0.05)", 
                                    color: "var(--text-secondary)", 
                                    border: "1px solid var(--border-color)",
                                    fontSize: "11px",
                                    padding: "2px 6px"
                                  }}
                                >
                                  {p.payment_methods?.method_name || "Chưa rõ"}: {formatPrice(p.amount)}
                                </span>
                              ))}
                            </div>
                          ) : reg?.payment_methods ? (
                            <span className="badge" style={{ background: "var(--bg-card-hover)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                              {reg.payment_methods.method_name}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.card_issued && (
                        <td>
                          {reg ? (
                            !reg.is_card_issued ? (
                              <span className="badge" style={{ background: "var(--bg-glass)", color: "var(--text-secondary)" }}>
                                Chưa cấp thẻ
                              </span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span className="badge badge-indigo">Đã cấp thẻ</span>
                                {reg.card_reissue_count > 0 && (
                                  <span style={{ fontSize: 11, color: "var(--accent-amber)" }}>
                                    (Cấp lại lần {reg.card_reissue_count})
                                  </span>
                                )}
                              </div>
                            )
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td>
                          {reg ? (
                            <span className={`badge ${reg.status === "ACTIVE" ? "badge-emerald" : reg.status === "CANCELLED" ? "badge-rose" : "badge-slate"}`}>
                              <span className={`status-dot ${reg.status === "ACTIVE" ? "active" : ""}`}></span>
                              {reg.status === "ACTIVE" ? "Hoạt động" : reg.status === "CANCELLED" ? "Đã hủy" : reg.status}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.created_at && (
                        <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          {new Date(student.created_at).toLocaleDateString("vi-VN")}
                        </td>
                      )}
                      <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap", minWidth: 260 }}>
                        {reg && reg.status === "ACTIVE" && reg.debt_amount > 0 && (
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ 
                              background: "rgba(16, 185, 129, 0.15)", 
                              color: "var(--accent-emerald-light)", 
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              padding: "4px 8px",
                              fontSize: 12
                            }} 
                            onClick={() => handleOpenPayDebt(student)}
                          >
                            TT công nợ
                          </button>
                        )}
                        {reg && reg.status === "ACTIVE" && (
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ 
                              color: "var(--accent-rose)",
                              border: "1px solid rgba(244, 63, 94, 0.2)",
                              padding: "4px 8px",
                              fontSize: 12
                            }} 
                            onClick={() => handleOpenCancel(student)}
                          >
                            Hủy ĐK
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(student)}>
                          Sửa
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: "var(--accent-rose)" }}
                          onClick={() => handleDelete(student.id, student.full_name)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Sửa học viên */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setError(""); }}
        title="Sửa thông tin Học viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}
        <div className="form-grid-2">
          {/* Cột 1: Thông tin Học viên */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)" }}>Thông tin Cơ bản</h4>
            <div className="form-group">
              <label className="form-label">Họ tên Học viên *</label>
              <input
                className="form-input"
                placeholder="VD: Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
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
                className="form-input"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                className="form-input"
                placeholder="VD: 0901234567"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lớp</label>
              <input
                className="form-input"
                placeholder="VD: 5A"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trường học</label>
              <select
                className="form-input"
                value={formData.school_id || ""}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    school_id: e.target.value,
                    other_school_name: e.target.value === "other" ? "" : ""
                  });
                }}
              >
                <option value="">-- Chọn trường --</option>
                {schools?.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                <option value="other">Trường khác...</option>
              </select>
            </div>
            {formData.school_id === "other" && (
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Nhập tên trường khác..."
                  value={formData.other_school_name || ""}
                  onChange={(e) => setFormData({ ...formData, other_school_name: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <textarea
                className="form-input"
                style={{ minHeight: "60px" }}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Cột 2: Ghi danh & Thanh toán */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)" }}>Ghi danh & Thanh toán</h4>
            <div className="form-group">
              <label className="form-label">Gói học *</label>
              <select
                className="form-input"
                value={formData.package_id || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedPkg = packages.find(p => p.id === val);
                  setFormData(prev => {
                    const priceStr = selectedPkg ? selectedPkg.price.toString() : "";
                    const defaultPayments = prev.payments.length <= 1 && paymentMethods.length > 0
                      ? [{ payment_method_id: prev.payments[0]?.payment_method_id || paymentMethods[0].id, amount: priceStr }]
                      : prev.payments;
                    return {
                      ...prev,
                      package_id: val,
                      amount_paid: priceStr,
                      payments: defaultPayments
                    };
                  });
                }}
              >
                <option value="">-- Chọn gói học --</option>
                {packages?.map(p => <option key={p.id} value={p.id}>{p.package_name} ({formatPrice(p.price)})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số buổi</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={formData.remaining_sessions}
                onChange={(e) => setFormData({ ...formData, remaining_sessions: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Số tiền đóng thực tế (VNĐ) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.amount_paid}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => {
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
              <div className="price-display" style={{ background: "rgba(244, 63, 94, 0.05)", border: "1px dashed rgba(244, 63, 94, 0.2)", padding: "8px 12px", borderRadius: "6px" }}>
                <span style={{ color: "var(--accent-rose)", fontWeight: 600, fontSize: "14px" }}>
                  {(() => {
                    const selectedPkg = packages.find(p => p.id === formData.package_id);
                    const price = selectedPkg?.price || 0;
                    const paid = Number(formData.amount_paid) || 0;
                    return formatPrice(Math.max(0, price - paid));
                  })()}
                </span>
              </div>
            </div>

            {Number(formData.amount_paid) > 0 && (
              <div style={{ marginTop: "12px", background: "var(--bg-glass-hover)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>🔗 Phương thức thanh toán phối hợp</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        payments: [...prev.payments, { payment_method_id: paymentMethods[0]?.id || "", amount: "" }]
                      }));
                    }}
                    style={{ fontSize: "11px", padding: "2px 6px", border: "1px solid var(--border-color)" }}
                  >
                    + Thêm dòng
                  </button>
                </div>

                {formData.payments.map((payment, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                    <select
                      className="form-input"
                      style={{ flex: 1.2, padding: "4px 8px", fontSize: "12px" }}
                      value={payment.payment_method_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          payments: prev.payments.map((p, i) => i === idx ? { ...p, payment_method_id: val } : p)
                        }));
                      }}
                    >
                      <option value="">— Chọn hình thức —</option>
                      {paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.method_name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="form-input"
                      style={{ flex: 1, padding: "4px 8px", fontSize: "12px" }}
                      placeholder="Số tiền..."
                      value={payment.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          payments: prev.payments.map((p, i) => i === idx ? { ...p, amount: val } : p)
                        }));
                      }}
                    />
                    {formData.payments.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            payments: prev.payments.filter((_, i) => i !== idx)
                          }));
                        }}
                        style={{ color: "var(--accent-rose)", padding: "4px" }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}

                {(() => {
                  const totalPaid = Number(formData.amount_paid) || 0;
                  const sumPayments = formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                  const diff = Math.abs(sumPayments - totalPaid);
                  if (diff > 0.01) {
                    return (
                      <div style={{ fontSize: "11px", color: "var(--accent-amber)" }}>
                        ⚠️ Chưa khớp! Lệch: {formatPrice(diff)}
                      </div>
                    );
                  }
                  return (
                    <div style={{ fontSize: "11px", color: "var(--accent-emerald-light)" }}>
                      ✅ Tổng tiền các phương thức đã khớp
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">Số phiếu thu *</label>
              <input
                className="form-input"
                placeholder="Số phiếu thu (nếu có)"
                value={formData.receipt_number || ""}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="EXPIRED">Hết hạn / Hết buổi</option>
                <option value="CANCELLED">Đã hủy / Hoàn phí</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái thẻ nhựa</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "var(--bg-glass-hover)", padding: "12px", borderRadius: "6px" }}>
                {!formData.is_card_issued ? (
                  <>
                    <span className="badge badge-slate">Chưa cấp thẻ</span>
                    {formData.registration_id && (
                      <button 
                        type="button"
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleIssueCard(formData.registration_id, editingId as string)}
                        style={{ padding: "4px 12px", fontSize: 13 }}
                      >
                        Phát thẻ ngay
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="badge badge-indigo">Đã cấp thẻ</span>
                    {formData.card_reissue_count > 0 && (
                      <span style={{ fontSize: 12, color: "var(--accent-amber)", fontWeight: 500 }}>
                        (Cấp lại lần {formData.card_reissue_count})
                      </span>
                    )}
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleOpenReissue(formData.registration_id)}
                      style={{ color: "var(--accent-amber)", border: "1px solid var(--accent-amber)", padding: "4px 12px", fontSize: 13 }}
                    >
                      Cấp lại thẻ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Cấp lại thẻ */}
      <Modal
        isOpen={isReissueModalOpen}
        onClose={() => { setIsReissueModalOpen(false); setReissueError(""); }}
        title="Cấp lại thẻ Học viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsReissueModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmitReissue} disabled={isReissuing}>
              {isReissuing ? "Đang xử lý..." : "Xác nhận cấp lại"}
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 16, fontSize: 14, color: "var(--text-muted)" }}>
          Việc cấp lại thẻ sẽ <strong>vô hiệu hóa mã thẻ cũ</strong>. Vui lòng nhập tay mã thẻ mới được in trên thẻ nhựa.
        </div>
        {reissueError && (
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {reissueError}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Mã thẻ mới *</label>
          <input
            className="form-input"
            placeholder="Nhập mã in trên thẻ nhựa (VD: HE26XXX...)"
            value={newCardCode}
            onChange={(e) => setNewCardCode(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal Tất toán công nợ */}
      <Modal
        isOpen={isPayDebtModalOpen}
        onClose={() => setIsPayDebtModalOpen(false)}
        title="💰 Tất toán công nợ Học viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsPayDebtModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handlePayDebtSubmit} disabled={isPayDebtSubmitting}>
              {isPayDebtSubmitting ? "Đang xử lý..." : "Xác nhận tất toán"}
            </button>
          </>
        }
      >
        {payDebtError && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            {payDebtError}
          </div>
        )}
        <div style={{ background: "var(--bg-glass-hover)", padding: 12, borderRadius: 6, marginBottom: 16, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            Học viên: <strong style={{ color: "var(--text-primary)" }}>{payDebtInfo.studentName}</strong>
          </div>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            Gói học đăng ký: <strong style={{ color: "var(--text-primary)" }}>{payDebtInfo.packageName}</strong>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Công nợ cần tất toán: <strong style={{ color: "var(--accent-rose)", fontSize: 15 }}>{formatPrice(payDebtInfo.currentDebt)}</strong>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Số tiền đóng thêm (VNĐ) *</label>
          <input
            type="number"
            className="form-input"
            value={payDebtFormData.amount_to_pay}
            onChange={(e) => {
              const val = e.target.value;
              setPayDebtFormData(prev => {
                const updatedPayments = prev.payments.length === 1
                  ? [{ ...prev.payments[0], amount: val }]
                  : prev.payments;
                return { ...prev, amount_to_pay: val, payments: updatedPayments };
              });
            }}
          />
        </div>

        {Number(payDebtFormData.amount_to_pay) > 0 && (
          <div style={{ marginTop: "12px", background: "var(--bg-card)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "12px", marginBottom: 0 }}>🔗 Phương thức thanh toán phối hợp</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPayDebtFormData(prev => ({
                    ...prev,
                    payments: [...prev.payments, { payment_method_id: paymentMethods[0]?.id || "", amount: "" }]
                  }));
                }}
                style={{ fontSize: "11px", padding: "2px 6px" }}
              >
                + Thêm dòng
              </button>
            </div>

            {payDebtFormData.payments.map((payment, idx) => (
              <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <select
                  className="form-select"
                  style={{ flex: 1.2, padding: "6px 8px", fontSize: "12px" }}
                  value={payment.payment_method_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayDebtFormData(prev => ({
                      ...prev,
                      payments: prev.payments.map((p, i) => i === idx ? { ...p, payment_method_id: val } : p)
                    }));
                  }}
                >
                  <option value="">— Chọn hình thức —</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.method_name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="form-input"
                  style={{ flex: 1, padding: "6px 8px", fontSize: "12px" }}
                  placeholder="Số tiền..."
                  value={payment.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayDebtFormData(prev => ({
                      ...prev,
                      payments: prev.payments.map((p, i) => i === idx ? { ...p, amount: val } : p)
                    }));
                  }}
                />
                {payDebtFormData.payments.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setPayDebtFormData(prev => ({
                        ...prev,
                        payments: prev.payments.filter((_, i) => i !== idx)
                      }));
                    }}
                    style={{ color: "var(--accent-rose)", padding: "4px" }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}

            {(() => {
              const totalPaid = Number(payDebtFormData.amount_to_pay) || 0;
              const sumPayments = payDebtFormData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
              const diff = Math.abs(sumPayments - totalPaid);
              if (diff > 0.01) {
                return (
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: 4 }}>
                    ⚠️ Chưa khớp tiền đóng! Lệch: {formatPrice(diff)}
                  </div>
                );
              }
              return (
                <div style={{ fontSize: "11px", color: "var(--accent-emerald-light)", marginTop: 4 }}>
                  ✅ Đã khớp tổng tiền
                </div>
              );
            })()}
          </div>
        )}

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Số phiếu thu mới *</label>
          <input
            className="form-input"
            placeholder="VD: PT-TT001"
            value={payDebtFormData.receipt_number}
            onChange={(e) => setPayDebtFormData({ ...payDebtFormData, receipt_number: e.target.value })}
          />
        </div>
      </Modal>

      {/* Modal Hủy đăng ký & Hoàn tiền */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="❌ Hủy Đăng Ký Học Viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsCancelModalOpen(false)}>
              Đóng
            </button>
            <button className="btn btn-primary" style={{ background: "var(--accent-rose)" }} onClick={handleCancelSubmit} disabled={isCancelSubmitting}>
              {isCancelSubmitting ? "Đang xử lý..." : "Xác nhận hủy đăng ký"}
            </button>
          </>
        }
      >
        {cancelError && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            {cancelError}
          </div>
        )}
        <div style={{ background: "var(--bg-glass-hover)", padding: 12, borderRadius: 6, marginBottom: 16, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            Học viên: <strong style={{ color: "var(--text-primary)" }}>{cancelInfo.studentName}</strong>
          </div>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            Gói đăng ký: <strong style={{ color: "var(--text-primary)" }}>{cancelInfo.packageName}</strong>
          </div>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            Số tiền đã đóng: <strong style={{ color: "var(--accent-emerald-light)" }}>{formatPrice(cancelInfo.amountPaid)}</strong>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Số buổi học còn lại: <strong style={{ color: "var(--accent-emerald-light)" }}>{cancelInfo.remainingSessions} buổi</strong>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Phương án hủy *</label>
          <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-primary)" }}>
              <input
                type="radio"
                name="isRefund"
                checked={!cancelFormData.isRefund}
                onChange={() => setCancelFormData(prev => ({ ...prev, isRefund: false, refund_amount: "0" }))}
                style={{ accentColor: "var(--accent-rose)" }}
              />
              Không hoàn tiền
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-primary)" }}>
              <input
                type="radio"
                name="isRefund"
                checked={cancelFormData.isRefund}
                onChange={() => setCancelFormData(prev => ({ ...prev, isRefund: true }))}
                style={{ accentColor: "var(--accent-rose)" }}
              />
              Có hoàn trả học phí
            </label>
          </div>
        </div>

        {cancelFormData.isRefund && (
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8, border: "1px solid var(--border-color)", marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Số tiền hoàn trả (VNĐ) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Nhập số tiền hoàn trả..."
                value={cancelFormData.refund_amount}
                onChange={(e) => setCancelFormData({ ...cancelFormData, refund_amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phương thức hoàn trả *</label>
              <select
                className="form-select"
                value={cancelFormData.refund_method}
                onChange={(e) => setCancelFormData({ ...cancelFormData, refund_method: e.target.value })}
              >
                <option value="">— Chọn phương thức —</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.method_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Chứng từ/Hóa đơn hoàn tiền (Ảnh) *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    color: "var(--text-secondary)",
                    background: "var(--bg-glass-hover)",
                    padding: "8px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                />
                
                {cancelFormData.refund_receipt_image && (
                  <div style={{ marginTop: "8px", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px", background: "var(--bg-card)", display: "inline-block", maxWidth: "200px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Preview ảnh đã nén:</div>
                    <img 
                      src={cancelFormData.refund_receipt_image} 
                      alt="Chứng từ hoàn tiền" 
                      style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "4px" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Lý do hủy / Ghi chú hủy đăng ký *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="VD: Học viên chuyển chỗ ở, chấn thương không thể tiếp tục..."
            value={cancelFormData.cancellation_notes}
            onChange={(e) => setCancelFormData({ ...cancelFormData, cancellation_notes: e.target.value })}
          ></textarea>
        </div>
      </Modal>

      {/* Modal Chi tiết Học viên */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="👤 Chi tiết Học viên & Lịch sử Đăng ký"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {detailsStudent?.registrations?.[0]?.status === "ACTIVE" && detailsStudent.registrations[0].debt_amount > 0 && (
              <button 
                type="button"
                className="btn btn-primary"
                style={{ 
                  background: "rgba(16, 185, 129, 0.15)", 
                  color: "var(--accent-emerald-light)", 
                  border: "1px solid rgba(16, 185, 129, 0.3)"
                }}
                onClick={handlePayDebtFromDetails}
              >
                💰 TT công nợ
              </button>
            )}
            {detailsStudent?.registrations?.[0]?.status === "ACTIVE" && (
              <button 
                type="button"
                className="btn"
                style={{ 
                  color: "var(--accent-rose)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                  background: "rgba(244, 63, 94, 0.05)"
                }}
                onClick={handleCancelFromDetails}
              >
                ❌ Hủy ĐK
              </button>
            )}
            <button 
              type="button"
              className="btn btn-ghost" 
              onClick={handleEditFromDetails}
              style={{ border: "1px solid var(--border-color)" }}
            >
              ✏️ Sửa thông tin
            </button>
            <button 
              type="button"
              className="btn btn-ghost" 
              style={{ color: "var(--accent-rose)", border: "1px solid rgba(244, 63, 94, 0.2)" }}
              onClick={handleDeleteFromDetails}
            >
              🗑️ Xóa học viên
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setIsDetailsModalOpen(false)}>
              Đóng
            </button>
          </div>
        }
      >
        {detailsStudent && (() => {
          const reg = detailsStudent.registrations?.[0];
          return (
            <div className="form-grid-2">
              {/* Cột Trái: Thông tin cá nhân */}
              <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>Thông tin Cá nhân</h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Họ tên:</span>
                    <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>{detailsStudent.full_name}</strong>
                  </div>
                  
                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Ngày sinh:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{detailsStudent.dob ? new Date(detailsStudent.dob).toLocaleDateString("vi-VN") : "—"}</span>
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Giới tính:</span>
                    {detailsStudent.gender ? (
                      <span className={`badge ${detailsStudent.gender === "Nam" ? "badge-indigo" : detailsStudent.gender === "Nữ" ? "badge-rose" : "badge-slate"}`} style={{ display: "inline-block" }}>
                        {detailsStudent.gender}
                      </span>
                    ) : "—"}
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Số điện thoại:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{detailsStudent.phone_number || "—"}</span>
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Lớp:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{detailsStudent.class_name || "—"}</span>
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Trường học:</span>
                    {detailsStudent.schools ? (
                      <span className="badge badge-indigo">
                        [{detailsStudent.schools.school_code}] {detailsStudent.schools.school_name}
                      </span>
                    ) : detailsStudent.other_school_name ? (
                      <span className="badge badge-amber">{detailsStudent.other_school_name}</span>
                    ) : (
                      "—"
                    )}
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-block", width: "110px" }}>Ngày đăng ký:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{new Date(detailsStudent.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>

                  <div style={{ fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ghi chú:</span>
                    <div style={{ background: "var(--bg-glass-hover)", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", color: "var(--text-secondary)", minHeight: "40px", border: "1px solid var(--border-color)", whiteSpace: "pre-wrap" }}>
                      {detailsStudent.notes || "Không có ghi chú"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột Phải: Ghi danh & Thanh toán */}
              <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>Ghi danh & Thanh toán</h4>
                
                {reg ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Trạng thái:</span>
                      <span className={`badge ${reg.status === "ACTIVE" ? "badge-emerald" : reg.status === "CANCELLED" ? "badge-rose" : "badge-slate"}`}>
                        {reg.status === "ACTIVE" ? "Hoạt động" : reg.status === "CANCELLED" ? "Đã hủy" : reg.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Mã thẻ học viên:</span>
                      <strong style={{ fontFamily: "monospace", fontSize: "14px", color: "var(--accent-indigo-light)" }}>{reg.card_code}</strong>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Gói học:</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{reg.pricing_packages?.package_name || "—"}</span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Môn học:</span>
                      <span style={{ color: "var(--text-secondary)" }}>{reg.pricing_packages?.subject || "—"}</span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Số buổi còn lại:</span>
                      <strong style={{ color: "var(--accent-emerald-light)" }}>{reg.remaining_sessions} buổi</strong>
                    </div>

                    <div style={{ borderTop: "1px dashed var(--border-color)", margin: "4px 0" }}></div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Giá gói học:</span>
                      <span style={{ color: "var(--text-primary)" }}>{formatPrice(reg.pricing_packages?.price || 0)}</span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Số tiền đã đóng:</span>
                      <strong style={{ color: "var(--accent-emerald-light)" }}>{formatPrice(reg.amount_paid)}</strong>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)", display: "inline-block", width: "130px" }}>Công nợ hiện tại:</span>
                      <strong style={{ color: reg.debt_amount > 0 ? "var(--accent-rose)" : "var(--text-muted)", fontSize: "14px" }}>
                        {formatPrice(reg.debt_amount)}
                      </strong>
                    </div>

                    <div style={{ fontSize: "13px", marginTop: "4px" }}>
                      <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Lịch sử đợt đóng tiền:</span>
                      {reg.registration_payments && reg.registration_payments.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {reg.registration_payments.map((p, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "12px" }}>
                              <span style={{ color: "var(--text-secondary)" }}>{p.payment_methods?.method_name || "Phương thức khác"}</span>
                              <strong style={{ color: "var(--text-primary)" }}>{formatPrice(p.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Không có chi tiết đợt đóng</div>
                      )}
                    </div>

                    <div style={{ fontSize: "13px", marginTop: "12px", borderTop: "1px dashed var(--border-color)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Ảnh phiếu thu học viên:</span>
                        {reg.status === "ACTIVE" && (!reg.receipt_images || reg.receipt_images.length < 2) && (
                          <div style={{ position: "relative" }}>
                            <input 
                              type="file"
                              multiple
                              accept="image/*"
                              style={{ display: "none" }}
                              id="details-receipt-upload"
                              onChange={handleUploadReceiptImage}
                              disabled={isDetailsImageUploading}
                            />
                            <label 
                              htmlFor="details-receipt-upload"
                              style={{ 
                                fontSize: "11px", 
                                color: "var(--accent-indigo-light)", 
                                cursor: isDetailsImageUploading ? "not-allowed" : "pointer", 
                                border: "1px dashed var(--accent-indigo-light)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(99, 102, 241, 0.05)",
                                display: "inline-block"
                              }}
                            >
                              {isDetailsImageUploading ? "Đang tải..." : "➕ Thêm ảnh"}
                            </label>
                          </div>
                        )}
                      </div>

                      {reg.receipt_images && reg.receipt_images.length > 0 ? (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                          {reg.receipt_images.map((imgUrl, idx) => (
                            <div key={idx} style={{ position: "relative", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "2px", background: "var(--bg-card)" }}>
                              <img 
                                src={imgUrl} 
                                alt={`Phiếu thu ${idx + 1}`} 
                                onClick={() => {
                                  setBillViewerUrl(imgUrl);
                                  setIsBillViewerOpen(true);
                                }}
                                style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "3px", cursor: "zoom-in" }}
                              />
                              {reg.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReceiptImage(idx)}
                                  style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    background: "var(--accent-rose)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "14px",
                                    height: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "8px",
                                    cursor: "pointer"
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Chưa có ảnh phiếu thu</div>
                      )}
                    </div>

                    {reg.status === "CANCELLED" && (
                      <div style={{ borderTop: "1px dashed var(--border-color)", marginTop: "10px", paddingTop: "10px" }}>
                        <h5 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--accent-rose)" }}>Thông tin Hủy Ghi danh</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Ngày hủy:</span>{" "}
                            <span style={{ color: "var(--text-secondary)" }}>{reg.cancelled_at ? new Date(reg.cancelled_at).toLocaleDateString("vi-VN") : "—"}</span>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Số tiền hoàn trả:</span>{" "}
                            <strong style={{ color: "var(--accent-rose)" }}>{formatPrice(reg.refund_amount || 0)}</strong>
                          </div>
                          {(reg.refund_amount ?? 0) > 0 && (
                            <>
                              <div>
                                <span style={{ color: "var(--text-muted)" }}>Phương thức hoàn:</span>{" "}
                                <span style={{ color: "var(--text-secondary)" }}>{reg.refund_method || "—"}</span>
                              </div>
                              {reg.refund_receipt_image && (
                                <div>
                                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Chứng từ hoàn trả (click để phóng to):</span>
                                  <img 
                                    src={reg.refund_receipt_image} 
                                    alt="Chứng từ hoàn tiền" 
                                    onClick={() => {
                                      setBillViewerUrl(reg.refund_receipt_image!);
                                      setIsBillViewerOpen(true);
                                    }}
                                    style={{ maxWidth: "100px", maxHeight: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)", cursor: "zoom-in" }}
                                  />
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Lý do hủy:</span>{" "}
                            <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", padding: "6px 10px", borderRadius: "4px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                              {reg.cancellation_notes || "Không có lý do chi tiết"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa đăng ký gói học nào</div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Phóng to Chứng từ / Bill Viewer */}
      <Modal
        isOpen={isBillViewerOpen}
        onClose={() => setIsBillViewerOpen(false)}
        title="🖼️ Chứng từ / Hóa đơn hoàn tiền"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setIsBillViewerOpen(false)}>
            Đóng
          </button>
        }
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.1)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          {billViewerUrl ? (
            <img 
              src={billViewerUrl} 
              alt="Hóa đơn chứng từ kích thước đầy đủ" 
              style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "4px" }}
            />
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Không tìm thấy ảnh chứng từ</span>
          )}
        </div>
      </Modal>
    </>
  );
}
