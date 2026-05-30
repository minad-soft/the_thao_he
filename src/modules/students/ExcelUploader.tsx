"use client";

import { useState, useRef } from "react";
import Modal from "@/components/Modal";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success?: boolean;
  message?: string;
  inserted_count?: number;
  error?: string;
  errors?: ValidationError[];
  total_rows?: number;
  error_count?: number;
}

interface ExcelUploaderProps {
  onImported: () => void;
}

export default function ExcelUploader({ onImported }: ExcelUploaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import-excel", {
        method: "POST",
        body: formData,
      });

      const data: ImportResult = await res.json();
      setResult(data);

      if (data.success) {
        onImported();
        setTimeout(() => {
          setFile(null);
        }, 2000);
      }
    } catch {
      setResult({ error: "Không thể kết nối server" });
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <>
      <div style={{ display: "flex", gap: "12px" }}>
        <a href="/sample_import.xlsx" download className="btn btn-ghost">
          📄 Tải file mẫu
        </a>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          📥 Import Excel
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title="📥 Import học viên từ Excel"
        footer={
          <>
            <button className="btn btn-ghost" onClick={resetModal}>
              Đóng
            </button>
            {file && !result?.success && (
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Đang xử lý..." : "Import"}
              </button>
            )}
          </>
        }
      >
        {/* Drop zone */}
        <div
          className={`excel-dropzone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          {file ? (
            <div className="excel-file-info">
              <span className="excel-file-icon">📊</span>
              <div>
                <div className="excel-file-name">{file.name}</div>
                <div className="excel-file-size">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="excel-dropzone-icon">📂</div>
              <div className="excel-dropzone-text">
                Kéo thả file Excel vào đây hoặc <strong>click để chọn</strong>
              </div>
              <div className="excel-dropzone-hint">.xlsx hoặc .xls</div>
            </>
          )}
        </div>

        {/* Hướng dẫn cột */}
        <div className="excel-columns-info">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Cột bắt buộc trong file Excel:
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="badge badge-rose">Họ tên</span>
            <span className="badge badge-rose">Mã thẻ</span>
            <span className="badge badge-indigo">SĐT</span>
            <span className="badge badge-indigo">Ghi chú</span>
          </div>
        </div>

        {/* Kết quả */}
        {result && (
          <div className={`excel-result ${result.success ? "success" : "error"}`}>
            {result.success ? (
              <div className="excel-result-success">
                <span style={{ fontSize: 24 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--accent-emerald-light)" }}>
                    {result.message}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, color: "var(--accent-rose)", marginBottom: 8 }}>
                  ❌ {result.error}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="excel-error-list">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="excel-error-item">
                        <span className="excel-error-row">Dòng {err.row}</span>
                        <span className="excel-error-field">{err.field}</span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>
                        ... và {result.errors.length - 10} lỗi khác
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
