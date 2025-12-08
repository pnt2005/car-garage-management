"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hàm kiểm tra active
  const isActive = (path) => pathname === path;

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          Quản lý gara ô tô
        </Link>

        <div className="hidden md:flex space-x-6">
          <Link
            href="/xe"
            className={`${isActive("/xe") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Xe
          </Link>

          <Link
            href="/phieusuachua"
            className={`${isActive("/phieusuachua") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Sửa chữa
          </Link>

          <Link
            href="/thutien"
            className={`${isActive("/thutien") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Thu tiền
          </Link>

          <Link
            href="/baocaodoanhso"
            className={`${isActive("/baocaodoanhso") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Báo cáo doanh số
          </Link>

          <Link
            href="/baocaoton"
            className={`${isActive("/baocaoton") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Báo cáo tồn
          </Link>

          <Link
            href="/phutung"
            className={`${isActive("/phutung") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Phụ tùng
          </Link>

          <Link
            href="/tiencong"
            className={`${isActive("/tiencong") ? "text-blue-600 font-semibold" : "hover:text-blue-500"}`}
          >
            Tiền công
          </Link>
        </div>
      </div>
    </nav>
  );
}
