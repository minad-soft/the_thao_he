"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../app/(dashboard)/checkin-batch/checkin-batch.css";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: string[];
  subItems?: {
    href: string;
    label: string;
    icon: string;
    roles: string[];
  }[];
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const navItems: NavGroup[] = [
  {
    section: "Tổng quan",
    items: [
      { href: "/", label: "Dashboard", icon: "📊", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
    ],
  },
  {
    section: "Quản lý",
    items: [
      { href: "/settings", label: "Cài đặt", icon: "⚙️", roles: ["ADMIN"] },
      { href: "/registration", label: "Ghi danh", icon: "📝", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
      { href: "/students", label: "Học viên", icon: "👥", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
      { 
        href: "/checkin", 
        label: "Check-in", 
        icon: "🎫",
        roles: ["ADMIN", "STAFF", "ACCOUNTANT"],
        subItems: [
          { href: "/checkin-batch", label: "Check-in Lớp", icon: "📋", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] }
        ]
      },
      { href: "#", label: "Huấn luyện viên", icon: "🏃", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
      { href: "/staff", label: "Nhân viên", icon: "👤", roles: ["ADMIN"] },
    ],
  },
  {
    section: "Báo cáo",
    items: [
      { href: "/reports", label: "Thống kê", icon: "📈", roles: ["ADMIN", "ACCOUNTANT"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState<{ full_name: string; role: string; username: string } | null>(null);

  // Lấy thông tin user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unauthenticated");
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Auto-close on mobile when resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
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

  const handleLogout = async () => {
    if (confirm("Bạn chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (res.ok) {
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
  };

  // Lọc menu dựa trên user role
  const filteredNavItems = navItems.map((group) => {
    const items = group.items.filter((item) => {
      if (!user) return false;
      const hasRole = item.roles.includes(user.role);
      if (!hasRole) return false;

      // Lọc subItems nếu có
      if (item.subItems) {
        const subFiltered = item.subItems.filter((sub) => sub.roles.includes(user.role));
        // Gán lại subItems đã lọc
        return {
          ...item,
          subItems: subFiltered
        };
      }

      return true;
    });

    return { ...group, items };
  }).filter((group) => group.items.length > 0);

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

      <aside className="sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🏊</div>
            <div>
              <div className="sidebar-logo-text">THỂ THAO HỌC ĐƯỜNG HÈ</div>
              <div className="sidebar-logo-sub">Summer 2026</div>
            </div>
          </div>
        </div>

        {/* User Profile Info */}
        {user && (
          <div className="sidebar-user" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", flexShrink: 0 }}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.full_name}
              </div>
              <span className={`badge ${
                user.role === 'ADMIN' ? 'badge-rose' : user.role === 'ACCOUNTANT' ? 'badge-amber' : 'badge-indigo'
              }`} style={{ fontSize: "10px", padding: "2px 8px", marginTop: "4px" }}>
                {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'ACCOUNTANT' ? 'Kế toán' : 'Nhân viên'}
              </span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav" style={{ flex: 1, overflowY: "auto", paddingBottom: "32px" }}>
          {filteredNavItems.map((group) => (
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

        {/* Logout Button */}
        {user && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)" }}>
            <button 
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                color: "var(--accent-rose)",
                background: "rgba(244, 63, 94, 0.05)",
                border: "1px solid rgba(244, 63, 94, 0.1)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
                e.currentTarget.style.borderColor = "var(--accent-rose)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.05)";
                e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.1)";
              }}
            >
              <span style={{ fontSize: "16px" }}>🚪</span>
              Đăng xuất
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
