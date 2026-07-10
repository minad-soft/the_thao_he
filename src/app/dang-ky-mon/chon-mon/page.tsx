"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import "@/app/globals.css";

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
  const [existingPreference, setExistingPreference] = useState<string | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [settings, setSettings] = useState<{ schedules: Record<string, Schedule[]>, locations: Record<string, string>, subjectNotes?: Record<string, {notes: string | null; show_notes: boolean}> }>({ schedules: {}, locations: {} });
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [confirmContent, setConfirmContent] = useState("");
  const [successContent, setSuccessContent] = useState<React.ReactNode>(null);
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

    // Fetch me
    fetch("/api/student-portal/me")
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.sports_preference) {
          setExistingPreference(data.sports_preference);
          setIsSaved(true);
        }
        setLoadingMe(false);
      })
      .catch(err => {
        console.error("Error fetching user info:", err);
        setLoadingMe(false);
      });
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

  const formatSchedules = (subjectName: string) => {
    const schedules = settings.schedules[subjectName];
    if (!schedules || schedules.length === 0) return "Chưa có lịch";
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
        {schedules.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontSize: '14px', marginTop: '2px' }}>•</span>
            <span style={{ lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span> ({s.daysOfWeek.join(", ")} | {s.startTime.slice(0,5)} - {s.endTime.slice(0,5)})
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getLocation = (subjectName: string) => {
    return settings.locations[subjectName] || "Chưa cập nhật địa điểm";
  };

  const getPreferenceDetails = (pref: string) => {
    if (!pref) return null;
    
    let title = "";
    let subjectsList: { name: string, scheduleLabel: string, locationLabel: string }[] = [];
    const note = "Lịch kiểm tra bơi trung tâm sẽ thông báo vào cuối khóa.";
    const contact = "Quý khách cần giải đáp thêm thông tin vui lòng liên hệ 0909932627 (cô Trang).";

    if (pref === "Ôn bơi - học bóng rổ - Kiểm tra bơi") {
      title = "Cảm ơn Quý khách đã chọn ÔN BƠI 5 BUỔI, 14 BUỔI HỌC BÓNG RỔ, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN).";
      subjectsList = [
        { name: "Ôn bơi", scheduleLabel: "Lịch ôn bơi", locationLabel: "Địa điểm ôn bơi" },
        { name: "Bóng rổ", scheduleLabel: "Lịch học bóng rổ", locationLabel: "Địa điểm bóng rổ" }
      ];
    } else if (pref === "Ôn bơi - học cầu lông - Kiểm tra bơi") {
      title = "Cảm ơn Quý khách đã chọn ÔN BƠI 5 BUỔI, 14 BUỔI HỌC CẦU LÔNG, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN).";
      subjectsList = [
        { name: "Ôn bơi", scheduleLabel: "Lịch ôn bơi", locationLabel: "Địa điểm ôn bơi" },
        { name: "Cầu lông", scheduleLabel: "Lịch học cầu lông", locationLabel: "Địa điểm cầu lông" }
      ];
    } else if (pref === "HỌC BƠI - Kiểm tra bơi") {
      title = "Cảm ơn Quý khách đã chọn 19 BUỔI HỌC BƠI, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN).";
      subjectsList = [
        { name: "Học bơi", scheduleLabel: "Lịch học bơi", locationLabel: "Địa điểm" }
      ];
    } else if (pref === "HỌC BÓNG RỔ") {
      title = "Cảm ơn Quý khách đã chọn 20 BUỔI HỌC BÓNG RỔ.";
      subjectsList = [
        { name: "Bóng rổ", scheduleLabel: "Lịch học bóng rổ", locationLabel: "Địa điểm" }
      ];
    } else if (pref === "HỌC CẦU LÔNG") {
      title = "Cảm ơn Quý khách đã chọn 20 BUỔI HỌC CẦU LÔNG.";
      subjectsList = [
        { name: "Cầu lông", scheduleLabel: "Lịch học cầu lông", locationLabel: "Địa điểm" }
      ];
    } else {
      return <div>Nguyện vọng của bạn: {pref}</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
          {title}
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subjectsList.map((sub, index) => {
                const noteObj = settings.subjectNotes?.[sub.name];
                return (
                    <div key={index} style={{ borderBottom: index < subjectsList.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: index < subjectsList.length - 1 ? '16px' : '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{sub.scheduleLabel}:</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatSchedules(sub.name)}</div>
                        </div>

                        {noteObj?.show_notes && noteObj?.notes && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ghi chú:</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'pre-wrap', background: 'rgba(99, 102, 241, 0.05)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--accent-indigo)' }}>{noteObj.notes}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{sub.locationLabel}:</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{getLocation(sub.name)}</div>
                        </div>

                    </div>
                )
            })}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
          {pref.includes("Kiểm tra bơi") && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span> <span>{note}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px dotted var(--border-color)' }}>
            <span>📞</span> <span>{contact}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
            <span style={{ flexShrink: 0 }}>💬</span> 
            <span style={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
              Mời học viên tham gia nhóm zalo <a href="https://zalo.me/g/jok1auvzvdj9vi8adfxp" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)', fontWeight: 500, textDecoration: 'underline' }}>tại đây</a> (https://zalo.me/g/jok1auvzvdj9vi8adfxp) để cập nhật các thông báo từ khóa thể thao hè.
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleOption1 = () => {
    setShowSubSelect(true);
  };

  const handleSubOption1 = (subChoice: "BÓNG RỔ" | "CẦU LÔNG") => {
    setShowSubSelect(false);
    const prefStr = `Ôn bơi - học ${subChoice.toLowerCase()} - Kiểm tra bơi`;
    setSelectedPreference(prefStr);
    setConfirmContent(`Quý khách đã chọn ÔN BƠI 5 BUỔI, 14 BUỔI HỌC ${subChoice}, 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN). Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.`);
    
    setSuccessContent(getPreferenceDetails(prefStr));
    setShowConfirmModal(true);
  };

  const handleOption2 = () => {
    const prefStr = "HỌC BƠI - Kiểm tra bơi";
    setSelectedPreference(prefStr);
    setConfirmContent("Quý khách đã chọn HỌC BƠI 19 BUỔI 1 BUỔI KIỂM TRA BƠI (CẤP CHỨNG NHẬN). Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    setSuccessContent(getPreferenceDetails(prefStr));
    setShowConfirmModal(true);
  };

  const handleOption3 = () => {
    const prefStr = "HỌC BÓNG RỔ";
    setSelectedPreference(prefStr);
    setConfirmContent("Quý khách đã chọn CHỈ HỌC BÓNG RỔ. Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    setSuccessContent(getPreferenceDetails(prefStr));
    setShowConfirmModal(true);
  };

  const handleOption4 = () => {
    const prefStr = "HỌC CẦU LÔNG";
    setSelectedPreference(prefStr);
    setConfirmContent("Quý khách đã chọn CHỈ HỌC CẦU LÔNG. Quý khách vui lòng bấm nút xác nhận nếu đồng ý hoặc bấm nút Chọn Lại.");
    
    setSuccessContent(getPreferenceDetails(prefStr));
    setShowConfirmModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '18px'
          }}>🎓</div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Cổng Học Viên
          </h1>
        </div>
        <button 
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
        >
          Đăng xuất
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '32px 20px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        backgroundImage: 'var(--gradient-glow)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center'
      }}>
        {loadingMe ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <span className="loading loading-spinner loading-lg"></span>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Đang tải dữ liệu...</p>
          </div>
        ) : existingPreference ? (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center', borderColor: 'var(--accent-indigo)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px', boxShadow: 'var(--shadow-glow-indigo)'
            }}>ℹ️</div>
            <h2 className="page-title" style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Bạn đã hoàn tất chọn môn
            </h2>
            <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-indigo)', margin: 0, marginBottom: '16px' }}>
                {existingPreference}
              </p>
              <button
                className="btn btn-outline"
                style={{ color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)', width: 'auto', display: 'inline-block' }}
                onClick={() => {
                  setSuccessContent(getPreferenceDetails(existingPreference));
                  setShowSuccessModal(true);
                }}
              >
                📋 Xem thông báo chi tiết
              </button>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Nếu có yêu cầu thay đổi vui lòng liên hệ <strong style={{ color: 'var(--accent-rose)' }}>0909932627</strong> (cô Trang).
            </p>
          </div>
        ) : !isSaved ? (
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 className="page-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
                Chọn Môn Học Mùa Hè
              </h2>
              <p className="page-subtitle">Vui lòng chọn 1 trong 4 nguyện vọng bên dưới để hoàn tất thủ tục.</p>
            </div>
            
            <div className="form-grid-2">
              <button onClick={handleOption1} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', border: '2px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-indigo)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}>
                <div style={{ fontSize: '40px' }}>🏊🏀</div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-indigo-light)' }}>
                  ÔN BƠI và học BÓNG RỔ HOẶC CẦU LÔNG
                </div>
              </button>
              
              <button onClick={handleOption2} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', border: '2px solid rgba(6, 182, 212, 0.3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'}>
                <div style={{ fontSize: '40px' }}>🏊</div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-cyan)' }}>
                  HỌC BƠI
                </div>
              </button>
              
              <button onClick={handleOption3} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', border: '2px solid rgba(245, 158, 11, 0.3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'}>
                <div style={{ fontSize: '40px' }}>🏀</div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-amber)' }}>
                  CHỈ HỌC BÓNG RỔ
                </div>
              </button>
              
              <button onClick={handleOption4} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', border: '2px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-emerald)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'}>
                <div style={{ fontSize: '40px' }}>🏸</div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-emerald-light)' }}>
                  CHỈ HỌC CẦU LÔNG
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center', borderColor: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-success)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px', boxShadow: 'var(--shadow-glow-emerald)'
            }}>✓</div>
            <h2 className="page-title" style={{ fontSize: '28px', marginBottom: '16px', background: 'var(--gradient-success)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Đã ghi nhận nguyện vọng!
            </h2>
            {existingPreference || selectedPreference ? (
              <div style={{ textAlign: "left", background: "var(--bg-glass)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 auto", maxWidth: "600px", marginTop: "16px" }}>
                {getPreferenceDetails(existingPreference || selectedPreference)}
              </div>
            ) : (
              <p className="page-subtitle" style={{ fontSize: '16px' }}>Bạn đã hoàn tất chọn môn. Bạn có thể đăng xuất một cách an toàn.</p>
            )}
          </div>
        )}
      </main>

      {/* Logout Warning Modal */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Cảnh báo đăng xuất"
        footer={
          <>
            <button onClick={() => setShowLogoutModal(false)} className="btn btn-ghost">Không</button>
            <button onClick={confirmLogout} className="btn btn-primary" style={{ background: 'var(--accent-rose)' }}>Có, đăng xuất</button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 8px 0' }}>Bạn chưa hoàn tất chọn môn</p>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Nguyện vọng của bạn chưa được lưu vào hệ thống. Bạn có chắc chắn muốn đăng xuất không?</p>
          </div>
        </div>
      </Modal>

      {/* Sub-select for Option 1 */}
      <Modal
        isOpen={showSubSelect}
        onClose={() => setShowSubSelect(false)}
        title="Chọn môn học kèm"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Vui lòng chọn 1 trong 2 môn sau để học kèm với ÔN BƠI:</p>
        <div className="form-grid-2">
          <button onClick={() => handleSubOption1("BÓNG RỔ")} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <span style={{ fontSize: '32px' }}>🏀</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>Bóng Rổ</span>
          </button>
          
          <button onClick={() => handleSubOption1("CẦU LÔNG")} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-emerald)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <span style={{ fontSize: '32px' }}>🏸</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-emerald-light)' }}>Cầu Lông</span>
          </button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận nguyện vọng"
        footer={
          <>
            <button onClick={() => setShowConfirmModal(false)} className="btn btn-ghost">Chọn Lại</button>
            <button onClick={savePreference} className="btn btn-primary">Xác Nhận</button>
          </>
        }
      >
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{confirmContent}</p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="🎉 Đăng ký thành công"
        footer={
          <button onClick={() => setShowSuccessModal(false)} className="btn btn-primary">Đóng</button>
        }
      >
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '20px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-line',
          lineHeight: 1.7
        }}>
          {successContent}
        </div>
      </Modal>

    </div>
  );
}
