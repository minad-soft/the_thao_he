"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function ShiftStatistics() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters state
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State
  const [modalShift, setModalShift] = useState<any | null>(null);
  const [modalStudents, setModalStudents] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [isExportingBulk, setIsExportingBulk] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/shift-statistics?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch shift statistics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="card" style={{ padding: "24px", textAlign: "center" }}>Đang tải thống kê ca học...</div>;
  }

  const subjects = Object.keys(data);
  if (subjects.length === 0) {
    return null;
  }

  // Flatten and Filter
  let allShifts: any[] = [];
  Object.entries(data).forEach(([subName, shifts]) => {
    shifts.forEach(shift => {
      allShifts.push({ ...shift, subject_name: subName });
    });
  });

  let filteredShifts = allShifts.filter(shift => {
    if (subjectFilter !== "ALL" && shift.subject_name !== subjectFilter) return false;
    
    const capacity = shift.capacity ?? 30;
    const registeredCount = shift.registered_count || 0;
    const percentage = Math.min(100, Math.round((registeredCount / capacity) * 100));
    const isFull = registeredCount >= capacity;
    const isAlmostFull = !isFull && percentage >= 80;

    if (statusFilter === "FULL" && !isFull) return false;
    if (statusFilter === "ALMOST_FULL" && !isAlmostFull) return false;
    if (statusFilter === "AVAILABLE" && (isFull || isAlmostFull)) return false;

    return true;
  });

  let chartData: any[] = [];
  if (subjectFilter === "ALL") {
    const subGroups: Record<string, { subject: string; capacity: number; registered: number }> = {};
    filteredShifts.forEach(shift => {
      if (!subGroups[shift.subject_name]) {
        subGroups[shift.subject_name] = { subject: shift.subject_name, capacity: 0, registered: 0 };
      }
      subGroups[shift.subject_name].capacity += (shift.capacity ?? 30);
      subGroups[shift.subject_name].registered += (shift.registered_count || 0);
    });
    chartData = Object.values(subGroups);
  } else {
    chartData = filteredShifts.map(shift => ({
      name: shift.shift_name,
      capacity: shift.capacity ?? 30,
      registered: shift.registered_count || 0
    }));
  }

  const exportStudentsToExcel = async (students: any[], filename: string) => {
    try {
      const { utils, writeFile } = await import("xlsx");
      
      const exportData = students.map((s, index) => ({
        "STT": index + 1,
        "Môn học": s.subject_name || "-",
        "Ca học": s.shift_name || "-",
        "Tên học viên": s.full_name,
        "Trường": s.school_name,
        "Trạng thái": s.status === 'ACTIVE' ? 'Đang học' : (s.status === 'PENDING' ? 'Chờ duyệt' : s.status)
      }));

      const worksheet = utils.json_to_sheet(exportData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "DanhSachHocVien");

      const wscols = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
      ];
      worksheet["!cols"] = wscols;

      writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Lỗi khi xuất dữ liệu.");
    }
  };

  const handleExportExcelShiftStats = async () => {
    try {
      if (filteredShifts.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
      }
      const { utils, writeFile } = await import("xlsx");
      const exportData = filteredShifts.map((shift, index) => {
        const capacity = shift.capacity ?? 30;
        const registeredCount = shift.registered_count || 0;
        const percentage = Math.min(100, Math.round((registeredCount / capacity) * 100));
        let status = "Còn chỗ";
        if (registeredCount >= capacity) status = "Đã đầy";
        else if (percentage >= 80) status = "Sắp đầy";

        return {
          "STT": index + 1,
          "Môn học": shift.subject_name,
          "Tên ca": shift.shift_name,
          "Thời gian": `${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`,
          "Ngày học": shift.days_of_week.join(", "),
          "Đã đăng ký": registeredCount,
          "Sức chứa": capacity,
          "Trạng thái": status
        };
      });

      const worksheet = utils.json_to_sheet(exportData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "ThongKeCaHoc");
      writeFile(workbook, `ThongKeCaHoc_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Lỗi khi xuất dữ liệu.");
    }
  };

  const handleViewShift = async (shift: any) => {
    setModalShift(shift);
    setLoadingModal(true);
    try {
      const res = await fetch(`/api/reports/shift-students?shiftIds=${shift.id}`);
      if (res.ok) {
        const data = await res.json();
        const mappedData = data.map((d: any) => ({
          ...d,
          subject_name: shift.subject_name,
          shift_name: shift.shift_name
        }));
        setModalStudents(mappedData);
      } else {
        alert("Không thể tải danh sách học viên.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleExportBulkStudents = async () => {
    if (filteredShifts.length === 0) {
      alert("Không có ca học nào để xuất danh sách.");
      return;
    }
    setIsExportingBulk(true);
    try {
      // Chunking shift ids if there are too many, but usually it's fine
      const shiftIds = filteredShifts.map(s => s.id).join(",");
      const res = await fetch(`/api/reports/shift-students?shiftIds=${shiftIds}`);
      if (res.ok) {
        const data = await res.json();
        // Map subject and shift names
        const mappedData = data.map((d: any) => {
          const shift = filteredShifts.find(s => s.id === d.shift_id);
          return {
            ...d,
            subject_name: shift?.subject_name || "",
            shift_name: shift?.shift_name || ""
          };
        });
        await exportStudentsToExcel(mappedData, "DanhSachHocVien_Gop");
      } else {
        alert("Lỗi khi lấy dữ liệu học viên.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingBulk(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{label}</div>
          <div className="chart-tooltip-value">Đã đăng ký: {payload[0].value}</div>
          <div className="chart-tooltip-sub">Sức chứa: {payload[1].value}</div>
        </div>
      );
    }
    return null;
  };

  const renderSubjectFilters = () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      <button 
        className={`btn ${subjectFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} 
        onClick={() => setSubjectFilter('ALL')}
        style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px' }}
      >
        Tất cả môn
      </button>
      {subjects.map(sub => (
        <button 
          key={sub}
          className={`btn ${subjectFilter === sub ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setSubjectFilter(sub)}
          style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px', background: subjectFilter === sub ? 'var(--accent-indigo)' : '' }}
        >
          {sub}
        </button>
      ))}
    </div>
  );

  const renderStatusFilters = () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      <button 
        className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} 
        onClick={() => setStatusFilter('ALL')}
        style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px' }}
      >
        Tất cả trạng thái
      </button>
      <button 
        className={`btn ${statusFilter === 'AVAILABLE' ? 'btn-primary' : 'btn-ghost'}`} 
        onClick={() => setStatusFilter('AVAILABLE')}
        style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px', background: statusFilter === 'AVAILABLE' ? 'var(--accent-emerald)' : '', color: statusFilter === 'AVAILABLE' ? '#fff' : 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
      >
        Còn chỗ
      </button>
      <button 
        className={`btn ${statusFilter === 'ALMOST_FULL' ? 'btn-primary' : 'btn-ghost'}`} 
        onClick={() => setStatusFilter('ALMOST_FULL')}
        style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px', background: statusFilter === 'ALMOST_FULL' ? 'var(--accent-amber)' : '', color: statusFilter === 'ALMOST_FULL' ? '#fff' : 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }}
      >
        Sắp đầy
      </button>
      <button 
        className={`btn ${statusFilter === 'FULL' ? 'btn-primary' : 'btn-ghost'}`} 
        onClick={() => setStatusFilter('FULL')}
        style={{ padding: '6px 12px', fontSize: '14px', minHeight: 'auto', height: '32px', background: statusFilter === 'FULL' ? 'var(--accent-rose)' : '', color: statusFilter === 'FULL' ? '#fff' : 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
      >
        Đã đầy
      </button>
    </div>
  );

  return (
    <>
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title">🕐 Thống kê Đăng ký Ca học</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ height: '36px', minHeight: '36px', fontSize: '14px' }} onClick={handleExportExcelShiftStats}>
              📥 Xuất Thống Kê (Excel)
            </button>
            <button className="btn btn-primary" style={{ height: '36px', minHeight: '36px', fontSize: '14px' }} onClick={handleExportBulkStudents} disabled={isExportingBulk}>
              {isExportingBulk ? "Đang xử lý..." : "👥 Xuất DS Học viên"}
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {/* Filters */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Bộ lọc nhanh:</div>
            {renderSubjectFilters()}
            {renderStatusFilters()}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ height: 350, marginBottom: "32px", paddingRight: "20px" }}>
              <h4 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                {subjectFilter === "ALL" ? "Tổng quan Sức chứa vs Đã đăng ký theo Môn học" : `Sức chứa vs Đã đăng ký - Môn ${subjectFilter}`}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey={subjectFilter === "ALL" ? "subject" : "name"} 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar name="Đã đăng ký" dataKey="registered" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar name="Sức chứa" dataKey="capacity" fill="var(--bg-glass-hover)" stroke="var(--border-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ background: "var(--bg-glass-hover)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "16px", marginRight: "8px" }}>📋</span>
              <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                Danh sách Ca học ({filteredShifts.length} ca)
              </strong>
            </div>
            
            {filteredShifts.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                Không tìm thấy ca học nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ margin: 0, border: "none", minWidth: "900px" }}>
                  <thead>
                    <tr>
                      <th>Môn học</th>
                      <th>Tên ca</th>
                      <th>Thời gian</th>
                      <th>Ngày học</th>
                      <th>Đã đăng ký / Sức chứa</th>
                      <th>Trạng thái</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShifts.map((shift: any) => {
                      const capacity = shift.capacity ?? 30;
                      const registeredCount = shift.registered_count || 0;
                      const isFull = registeredCount >= capacity;
                      const percentage = Math.min(100, Math.round((registeredCount / capacity) * 100));
                      
                      let statusColor = "var(--accent-emerald)";
                      if (percentage > 80) statusColor = "var(--accent-amber)";
                      if (isFull) statusColor = "var(--accent-rose)";

                      return (
                        <tr key={shift.id}>
                          <td>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                              {shift.subject_name}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {shift.shift_name}
                          </td>
                          <td>
                            <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {shift.days_of_week.map((d: string) => (
                                <span key={d} style={{ fontSize: 11, padding: "2px 6px", background: "var(--bg-secondary)", borderRadius: 4, color: "var(--text-secondary)" }}>
                                  {d}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: 14, fontWeight: 600, minWidth: "50px" }}>
                                {registeredCount} / {capacity}
                              </span>
                              <div style={{ width: "100px", height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${percentage}%`, background: statusColor }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            {isFull ? (
                              <span className="badge badge-rose">Đã đầy</span>
                            ) : percentage > 80 ? (
                              <span className="badge badge-amber">Sắp đầy</span>
                            ) : (
                              <span className="badge badge-emerald">Còn chỗ</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: "4px 8px", fontSize: "13px", height: "auto", minHeight: "28px" }}
                              onClick={() => handleViewShift(shift)}
                            >
                              👁️ Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalShift && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Học viên - {modalShift.shift_name} ({modalShift.subject_name})</h3>
              <button 
                onClick={() => setModalShift(null)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', padding: '0' }}>
              {loadingModal ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
              ) : (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => exportStudentsToExcel(modalStudents, `DanhSach_${modalShift.shift_name}`)}
                    >
                      📥 Xuất Excel Ca Này
                    </button>
                  </div>
                  
                  {modalStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Chưa có học viên nào đăng ký ca này.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table className="data-table" style={{ margin: 0, border: 'none' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>STT</th>
                            <th>Họ và Tên</th>
                            <th>Trường học</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalStudents.map((stu, i) => (
                            <tr key={stu.student_id}>
                              <td>{i + 1}</td>
                              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{stu.full_name}</td>
                              <td>{stu.school_name}</td>
                              <td>
                                {stu.status === 'ACTIVE' ? (
                                  <span className="badge badge-emerald">Đang học</span>
                                ) : stu.status === 'PENDING' ? (
                                  <span className="badge badge-amber">Chờ duyệt</span>
                                ) : (
                                  <span className="badge badge-rose">{stu.status}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
