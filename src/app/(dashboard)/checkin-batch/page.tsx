"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/modules/checkin/BarcodeScanner";
import "./checkin-batch.css";

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  days_of_week?: string[];
  active_batch_id?: string | null;
}

interface CheckinEntry {
  log_id: string;
  student_name: string;
  card_code?: string;
  school_name: string;
  subject_name: string;
  sessions_used: number;
  sessions_total: number;
  location: { lat: number; lng: number };
}

interface ShiftStudent {
  student_id: string;
  full_name: string;
  card_code: string;
  registration_id: string | null;
  remaining_sessions: number;
  has_active_registration: boolean;
}

export default function BatchCheckinPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [entries, setEntries] = useState<CheckinEntry[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  
  const [shiftStudents, setShiftStudents] = useState<ShiftStudent[]>([]);
  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"checklist" | "scanner">("checklist");
  
  const router = useRouter();

  useEffect(() => {
    fetch("/api/shifts")
      .then((r) => r.ok ? r.json() : [])
      .then(setShifts)
      .catch(console.error);
  }, []);

  const dayMapping = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const currentDayOfWeek = dayMapping[new Date().getDay()];

  const isPastTime = (timeStr: string) => {
    if (!timeStr) return false;
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const shiftTime = new Date();
    shiftTime.setHours(hours, minutes, 0, 0);
    return now > shiftTime;
  };

  const visibleShifts = showAll 
    ? shifts 
    : shifts.filter(s => s.days_of_week?.includes(currentDayOfWeek) && !isPastTime(s.end_time));

  const startBatch = async () => {
    if (!selectedShift) return alert("Vui lòng chọn lớp");
    const s = shifts.find(x => x.id === selectedShift);
    
    let currentBatchId = s?.active_batch_id || "";
    
    // Nêu chưa có batch thì tạo
    if (!currentBatchId) {
      const res = await fetch("/api/checkin/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: selectedShift }),
      });
      const json = await res.json();
      if (json.batchId) {
        currentBatchId = json.batchId;
      } else {
        return alert(json.error || "Lỗi tạo phiên điểm danh");
      }
    }
    
    setBatchId(currentBatchId);
    
    // Tải danh sách lớp
    fetch(`/api/shifts/${selectedShift}/students`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        setShiftStudents(data);
      })
      .catch(console.error);
      
    // Nếu có batch cũ, tải lại lịch sử điểm danh của nó
    if (s?.active_batch_id) {
      fetch(`/api/checkin/batch/${currentBatchId}`)
        .then(r => r.ok ? r.json() : { entries: [] })
        .then(data => {
           if (data.entries) {
             setEntries(data.entries);
             // Tích sẵn những bạn đã quét
             const checked = new Set<string>();
             data.entries.forEach((e: any) => {
               if (e.card_code) checked.add(e.card_code);
             });
             setCheckedStudents(checked);
           }
        })
        .catch(console.error);
    } else {
      setEntries([]);
      setCheckedStudents(new Set());
    }
  };

  const handleScan = async (code: string) => {
    if (!batchId) return;
    if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ GPS");
    
    // Thêm vào danh sách tích chọn
    setCheckedStudents(prev => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`/api/checkin/batch/${batchId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_code: code,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEntries((prev) => [
          ...prev,
          {
            log_id: "entry-" + Date.now(),
            student_name: code,
            card_code: code,
            school_name: "—",
            subject_name: "—",
            sessions_used: 1,
            sessions_total: 0,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          },
        ]);
        
        // Cập nhật lại UI danh sách học viên vãng lai nếu cần,
        // nhưng tạm thời quét là vào thẳng `entries` và `checkedStudents`.
      } else {
        alert(json.error || "Lỗi check-in");
        // Hủy tích nếu quét lỗi (optional)
        setCheckedStudents(prev => {
          const next = new Set(prev);
          next.delete(code);
          return next;
        });
      }
    });
  };

  const handleChecklistToggle = (card_code: string) => {
    setCheckedStudents(prev => {
      const next = new Set(prev);
      if (next.has(card_code)) next.delete(card_code);
      else next.add(card_code);
      return next;
    });
  };

  const submitChecklist = async (action: "save_draft" | "save" | "save_print") => {
    // Nếu đang ở checklist, submit toàn bộ danh sách đã tích
    const res = await fetch(`/api/checkin/batch/${batchId}/checklist-submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_codes: Array.from(checkedStudents), action }),
    });
    const json = await res.json();
    if (json.success) {
      if (action === "save_draft") {
        alert("Đã lưu tạm phiên điểm danh!");
        window.location.reload();
      } else {
        if (action === "save_print" && json.pdfUrl) window.open(json.pdfUrl, "_blank");
        alert("Hoàn tất phiên điểm danh!");
        window.location.reload();
      }
    } else {
      alert(json.error || "Lỗi hoàn tất");
    }
  };

  const finalize = async (action: "save" | "save_print") => {
    // Giữ nguyên logic cũ của nút finalize nếu họ chỉ quét
    if (activeTab === "checklist") {
       submitChecklist(action);
       return;
    }
    const res = await fetch(`/api/checkin/batch/${batchId}/finalize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (json.success) {
      if (action === "save_print" && json.pdfUrl) window.open(json.pdfUrl, "_blank");
      alert("Phiên điểm danh đã lưu thành công!");
      window.location.reload();
    } else {
      alert(json.error || "Lỗi hoàn tất");
    }
  };

  const selectedShiftInfo = shifts.find((s) => s.id === selectedShift);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check-in Hàng Loạt</h1>
        <p className="page-subtitle">Điểm danh theo lớp bằng Sổ tích chọn hoặc Máy quét thẻ</p>
      </div>

      {/* BƯỚC 1: Chọn lớp */}
      <div className="batch-step-card">
        <div className="batch-step-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="batch-step-num">1</span>
            Chọn lớp học
          </div>
          {!batchId && (
            <label style={{ fontSize: '13px', fontWeight: 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Hiển thị tất cả ca học
            </label>
          )}
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {visibleShifts.map((s) => (
              <div 
                key={s.id}
                onClick={() => !batchId && setSelectedShift(s.id)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedShift === s.id ? '2px solid var(--accent-indigo)' : (s.active_batch_id ? '1px solid #eab308' : '1px solid var(--border-color)'),
                  background: selectedShift === s.id ? 'rgba(99,102,241,0.08)' : (s.active_batch_id ? 'rgba(234,179,8,0.05)' : 'var(--bg-glass)'),
                  cursor: batchId ? 'not-allowed' : 'pointer',
                  opacity: batchId && selectedShift !== s.id ? 0.5 : 1,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {selectedShift === s.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--accent-indigo)', fontSize: '18px' }}>
                    ✓
                  </div>
                )}
                {s.active_batch_id && selectedShift !== s.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#fef9c3', color: '#854d0e', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    Đang điểm danh
                  </div>
                )}
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {s.subject || 'Môn học'}
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)', paddingRight: '24px' }}>{s.shift_name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏰</span> {s.start_time} - {s.end_time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅</span> {s.days_of_week?.join(", ") || "Chưa xếp lịch"}
                  </div>
                  {s.room_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏫</span> Phòng: {s.room_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {visibleShifts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>😴</div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Không có ca học nào khả dụng vào thời điểm này.</p>
                <button onClick={() => setShowAll(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', textDecoration: 'underline', marginTop: '8px', cursor: 'pointer' }}>
                  Xem tất cả các ca
                </button>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="batch-btn-start"
              onClick={startBatch}
              disabled={!selectedShift || !!batchId}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              {batchId ? "✓ Đang điểm danh" : (selectedShiftInfo?.active_batch_id ? "Tiếp tục điểm danh" : "Bắt đầu điểm danh")}
            </button>
          </div>
        </div>

        {batchId && selectedShiftInfo && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 14, color: "var(--accent-indigo-light)" }}>
            🏫 <strong>{selectedShiftInfo.shift_name}</strong>
            {selectedShiftInfo.room_name ? ` · Phòng ${selectedShiftInfo.room_name}` : ""}
            {` · ${selectedShiftInfo.start_time} – ${selectedShiftInfo.end_time}`}
          </div>
        )}
      </div>

      {/* BƯỚC 2 & 3: Hiện sau khi bắt đầu */}
      {batchId && (
        <div className="batch-main-grid" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button 
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'checklist' ? 'var(--accent-indigo)' : 'var(--bg-glass)', color: activeTab === 'checklist' ? 'white' : 'var(--text-primary)', fontWeight: 'bold' }}
              onClick={() => setActiveTab('checklist')}
            >
              📋 Sổ điểm danh (Tích chọn)
            </button>
            <button 
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'scanner' ? 'var(--accent-indigo)' : 'var(--bg-glass)', color: activeTab === 'scanner' ? 'white' : 'var(--text-primary)', fontWeight: 'bold' }}
              onClick={() => setActiveTab('scanner')}
            >
              📷 Máy quét thẻ (Quét liên tục)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '350px' }}>
              <div className="batch-step-card">
                {activeTab === 'scanner' ? (
                  <>
                    <div className="batch-step-title">Quét mã vạch thẻ</div>
                    <BarcodeScanner onScan={handleScan} />
                  </>
                ) : (
                  <>
                    <div className="card-body">
                    <div className="batch-step-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>DANH SÁCH LỚP</div>
                      <div style={{ fontSize: 13, fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                        <span style={{color: 'var(--text-secondary)'}}>📷 Quét vãng lai:</span>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.elements.namedItem('guestCode') as HTMLInputElement;
                          if (input.value.trim()) {
                            handleScan(input.value.trim());
                            input.value = '';
                          }
                        }}>
                          <input 
                            name="guestCode"
                            type="text" 
                            placeholder="Nhập mã thẻ..." 
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, width: 140, outline: 'none' }}
                            autoComplete="off"
                          />
                        </form>
                      </div>
                    </div>
                    
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40, textAlign: 'center' }}>#</th>
                            <th style={{ width: 50 }}>✓</th>
                            <th>Học viên</th>
                            <th>Mã thẻ</th>
                            <th style={{ textAlign: 'center' }}>Số buổi còn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftStudents.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
                                <div>Chưa có học viên nào đăng ký ca học này.</div>
                                <div style={{ fontSize: '13px', marginTop: '4px' }}>Bạn vẫn có thể quét thẻ vãng lai ở ô bên trên.</div>
                              </td>
                            </tr>
                          ) : shiftStudents.map((s, i) => (
                            <tr key={s.student_id} style={{ opacity: s.has_active_registration ? 1 : 0.6 }}>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td>
                                <input 
                                  type="checkbox" 
                                  disabled={!s.has_active_registration}
                                  checked={checkedStudents.has(s.card_code)}
                                  onChange={() => handleChecklistToggle(s.card_code)}
                                  style={{ width: 18, height: 18, cursor: s.has_active_registration ? 'pointer' : 'not-allowed' }}
                                />
                              </td>
                              <td style={{ fontWeight: 'bold' }}>{s.full_name}</td>
                              <td>{s.card_code}</td>
                              <td>
                                {s.has_active_registration ? (
                                  <span style={{ color: s.remaining_sessions > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                    {s.remaining_sessions} buổi
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>
                                    {s.registration_status === 'pending_payment' || s.registration_status?.startsWith('pending') 
                                      ? 'Chưa thanh toán' 
                                      : 'Hết hạn / K có gói'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Hiển thị thêm khách vãng lai đã quét */}
                          {Array.from(checkedStudents).filter(code => !shiftStudents.find(x => x.card_code === code)).map((code, i) => (
                            <tr key={'guest-'+code}>
                              <td style={{ textAlign: 'center', color: 'var(--accent-indigo)' }}>+</td>
                              <td>
                                <input type="checkbox" checked={true} onChange={() => handleChecklistToggle(code)} style={{ width: 18, height: 18 }} />
                              </td>
                              <td style={{ color: 'var(--accent-indigo)' }}>Khách / Vãng lai</td>
                              <td>{code}</td>
                              <td><span style={{fontSize: 12}}>(Thêm từ quét thẻ)</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ flex: '0 0 320px' }}>
              <div className="batch-step-card" style={{ position: 'sticky', top: 20 }}>
                <div className="batch-step-title">
                  Hoàn tất phiên
                </div>
                
                <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--accent-indigo)' }}>
                    {checkedStudents.size}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Học viên đánh dấu CÓ MẶT</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => submitChecklist("save_draft")}
                    style={{ padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <span>⏳</span> Lưu Tạm (Chưa trừ buổi)
                  </button>
                  
                  <button
                    className="batch-btn-save batch-btn-close"
                    onClick={() => finalize("save")}
                  >
                    <span>💾</span> Xác Nhận Hoàn Tất
                  </button>
                  <button
                    className="batch-btn-save batch-btn-print"
                    onClick={() => finalize("save_print")}
                  >
                    <span>🖨️</span> Xác Nhận &amp; In File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
