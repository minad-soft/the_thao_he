"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface Schedule {
  name: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
}

export default function SubjectSelectionPage() {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState<{ schedules: Record<string, Schedule[]>, locations: Record<string, string> }>({ schedules: {}, locations: {} });
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [confirmContent, setConfirmContent] = useState("");
  const [successContent, setSuccessContent] = useState("");
  const [selectedPreference, setSelectedPreference] = useState("");
  
  // Option 1 Sub-selection
  const [showSubSelect, setShowSubSelect] = useState(false);

  useEffect(() => {
    // Fetch settings
    fetch("/api/student-portal/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(data);
        }
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  useEffect(() => {
    // Handle beforeunload to warn users if not saved
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaved]);

  const handleLogout = async () => {
    if (!isSaved) {
      setShowLogoutModal(true);
      return;
    }
    await confirmLogout();
  };

  const confirmLogout = async () => {
    await fetch("/api/student-portal/auth/logout", { method: "POST" });
    router.push("/dang-ky-mon");
  };

  const savePreference = async () => {
    try {
      const res = await fetch("/api/student-portal/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: selectedPreference })
      });
      if (res.ok) {
        setIsSaved(true);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        alert("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.");
      }
    } catch (e) {
      alert("Lỗi kết nối.");
    }
  };

  // Helper to format schedules for display
  const formatSchedules = (subjectName: string) => {
    const schedules = settings.schedules[subjectName];
    if (!schedules || schedules.length === 0) return "Chưa có lịch";
    return schedules.map(s => `${s.name} (${s.daysOfWeek.join(", ")} | ${s.startTime.slice(0,5)} - ${s.endTime.slice(0,5)})`).join("; ");
  };

  const getLocation = (subjectName: string) => {
    return settings.locations[subjectName] || "Chưa cập nhật địa điểm";
  };

  const handleOption1 = () => {
    setShowSubSelect(true);
  };

  const handleSubOption1 = (subChoice: "BÓNG RỔ" | "CẦU LÔNG") => {
    setShowSubSelect(false);
    setSelectedPreference(`Ôn bơi - học ${subChoice.toLowerCase()} - Kiểm tra bơi`);
    setConfirmContent(`Quý khách đã chọn ÔN BƠI 5 BUỔI, 19 BUỔI HỌC ${subChoice}, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN). Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.`);
    
    const locationInfo = getLocation(subChoice === "BÓNG RỔ" ? "Bóng rổ" : "Cầu lông");
    const scheduleSwim = formatSchedules("Bơi");
    const scheduleSport = formatSchedules(subChoice === "BÓNG RỔ" ? "Bóng rổ" : "Cầu lông");
    
    setSuccessContent(`Cảm ơn Quý khách đã chọn ÔN BƠI 5 BUỔI, 19 BUỔI HỌC ${subChoice}, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN).\n\nLịch ôn bơi: ${scheduleSwim}.\nLịch học ${subChoice.toLowerCase()}: ${scheduleSport}.\nĐịa điểm: ${locationInfo}.\nLịch kiểm tra bơi trung tâm sẽ thông báo vào cuối khóa.\n\nQuý khách cần giải đáp thêm thông tin vui lòng liên hệ 0909932627 (cô Trang).`);
    setShowConfirmModal(true);
  };

  const handleOption2 = () => {
    setSelectedPreference("HỌC BƠI - Kiểm tra bơi");
    setConfirmContent("Quý khách đã chọn HỌC BƠI 19 BUỔI 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN). Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    const locationInfo = getLocation("Bơi");
    const scheduleSwim = formatSchedules("Bơi");
    
    setSuccessContent(`Cảm ơn Quý khách đã chọn 19 BUỔI HỌC BƠI, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN).\n\nLịch học bơi: ${scheduleSwim}.\nĐịa điểm: ${locationInfo}.\nLịch kiểm tra bơi trung tâm sẽ thông báo vào cuối khóa.\n\nQuý khách cần giải đáp thêm thông tin vui lòng liên hệ 0909932627 (cô Trang).`);
    setShowConfirmModal(true);
  };

  const handleOption3 = () => {
    setSelectedPreference("HỌC BÓNG RỔ");
    setConfirmContent("Quý khách đã chọn CHỈ HỌC BÓNG RỔ. Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    const locationInfo = getLocation("Bóng rổ");
    const scheduleSport = formatSchedules("Bóng rổ");
    
    setSuccessContent(`Cảm ơn Quý khách đã chọn 20 BUỔI HỌC BÓNG RỔ.\n\nLịch học: ${scheduleSport}\nĐịa điểm: ${locationInfo}.\n\nQuý khách cần giải đáp thêm thông tin vui lòng liên hệ 0909932627 (cô Trang).`);
    setShowConfirmModal(true);
  };

  const handleOption4 = () => {
    setSelectedPreference("HỌC CẦU LÔNG");
    setConfirmContent("Quý khách đã chọn CHỈ HỌC CẦU LÔNG. Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    const locationInfo = getLocation("Cầu lông");
    const scheduleSport = formatSchedules("Cầu lông");
    
    setSuccessContent(`Cảm ơn Quý khách đã chọn 20 BUỔI HỌC CẦU LÔNG.\n\nLịch học: ${scheduleSport}\nĐịa điểm: ${locationInfo}.\n\nQuý khách cần giải đáp thêm thông tin vui lòng liên hệ 0909932627 (cô Trang).`);
    setShowConfirmModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Cổng Học Viên - Chọn Môn</h1>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {!isSaved ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
              Vui lòng chọn nguyện vọng môn học
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleOption1} className="p-4 border-2 border-blue-500 rounded-xl text-blue-700 font-medium hover:bg-blue-50 transition-colors h-32 flex items-center justify-center text-center">
                ÔN BƠI và học BÓNG RỔ HOẶC CẦU LÔNG
              </button>
              
              <button onClick={handleOption2} className="p-4 border-2 border-teal-500 rounded-xl text-teal-700 font-medium hover:bg-teal-50 transition-colors h-32 flex items-center justify-center text-center">
                HỌC BƠI
              </button>
              
              <button onClick={handleOption3} className="p-4 border-2 border-orange-500 rounded-xl text-orange-700 font-medium hover:bg-orange-50 transition-colors h-32 flex items-center justify-center text-center">
                CHỈ HỌC BÓNG RỔ
              </button>
              
              <button onClick={handleOption4} className="p-4 border-2 border-purple-500 rounded-xl text-purple-700 font-medium hover:bg-purple-50 transition-colors h-32 flex items-center justify-center text-center">
                CHỈ HỌC CẦU LÔNG
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Đã ghi nhận nguyện vọng!</h2>
            <p className="text-green-700">Bạn đã hoàn tất chọn môn. Bạn có thể đăng xuất một cách an toàn.</p>
          </div>
        )}
      </main>

      {/* Logout Warning Modal */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Cảnh báo đăng xuất"
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Không</button>
            <button onClick={confirmLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Có, đăng xuất</button>
          </div>
        }
      >
        <p className="text-gray-700">Bạn chưa hoàn tất chọn môn, có chắc chắn muốn đăng xuất?</p>
      </Modal>

      {/* Sub-select for Option 1 */}
      <Modal
        isOpen={showSubSelect}
        onClose={() => setShowSubSelect(false)}
        title="Chọn môn học kèm"
      >
        <p className="text-gray-700 mb-4">Vui lòng chọn 1 trong 2 môn sau:</p>
        <div className="flex space-x-4">
          <button onClick={() => handleSubOption1("BÓNG RỔ")} className="flex-1 py-3 bg-orange-100 text-orange-800 font-medium rounded hover:bg-orange-200">Bóng Rổ</button>
          <button onClick={() => handleSubOption1("CẦU LÔNG")} className="flex-1 py-3 bg-purple-100 text-purple-800 font-medium rounded hover:bg-purple-200">Cầu Lông</button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận môn học"
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Chọn Lại</button>
            <button onClick={savePreference} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Xác Nhận</button>
          </div>
        }
      >
        <p className="text-gray-700">{confirmContent}</p>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Đăng ký thành công"
        footer={
          <div className="flex justify-end w-full">
            <button onClick={() => setShowSuccessModal(false)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Đóng</button>
          </div>
        }
      >
        <div className="text-gray-700 whitespace-pre-line leading-relaxed">
          {successContent}
        </div>
      </Modal>

    </div>
  );
}
