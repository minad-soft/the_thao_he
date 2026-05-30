"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../app/checkin-batch/checkin-batch.css";

const navItems = [
  {
    section: "Tổng quan",
    items: [
      { href: "/", label: "Dashboard", icon: "📊" },
    ],
  },
  {
    section: "Quản lý",
    items: [
      { href: "/settings", label: "Cài đặt", icon: "⚙️" },
      { href: "/registration", label: "Ghi danh", icon: "📝" },
      { href: "/students", label: "Học viên", icon: "👥" },
      { 
        href: "/checkin", 
        label: "Check-in", 
        icon: "🎫",
        subItems: [
          { href: "/checkin-batch", label: "Check-in Lớp", icon: "📋" }
        ]
      },
      { href: "#", label: "Huấn luyện viên", icon: "🏃" },
      { href: "/staff", label: "Nhân viên", icon: "👤" },
    ],
  },
  {
    section: "Báo cáo",
    items: [
      { href: "/reports", label: "Thống kê", icon: "📈" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Auto-close on mobile when resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    // Set initial state
    handleResize(); 
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync state to body classes for CSS layout control
  useEffect(() => {
    if (window.innerWidth < 768) {
      if (isOpen) {
        document.body.classList.add("sidebar-open");
        document.body.classList.remove("sidebar-closed");
      } else {
        document.body.classList.remove("sidebar-open");
      }
    } else {
      document.body.classList.remove("sidebar-open");
      if (isOpen) {
        document.body.classList.remove("sidebar-closed");
      } else {
        document.body.classList.add("sidebar-closed");
      }
    }
  }, [isOpen]);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={toggleSidebar}
        title={isOpen ? "Thu gọn menu" : "Mở rộng menu"}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      {/* Mobile Overlay */}
      <div 
        className="sidebar-overlay" 
        onClick={() => window.innerWidth < 768 && setIsOpen(false)}
      ></div>

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🏊</div>
            <div>
              <div className="sidebar-logo-text">THỂ THAO HỌC ĐƯỜNG HÈ</div>
              <div className="sidebar-logo-sub">Summer 2026</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section-title">{group.section}</div>
              {group.items.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                  {item.subItems && (
                    <div className="sidebar-submenu">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`sidebar-sublink ${pathname === subItem.href ? "active" : ""}`}
                        >
                          <span className="sidebar-link-icon" style={{ fontSize: '0.9em' }}>{subItem.icon}</span>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
