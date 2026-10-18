import type { UserRole } from '../types/roles';
import { GraduationCap, BookOpen, Sparkles } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher = ({ currentRole, onRoleChange }: RoleSwitcherProps) => (
  <div className="app-topbar shrink-0 flex items-center justify-between gap-4 px-5 lg:px-9" role="banner">
    <div className="flex items-center gap-3 min-w-0">
      <div className="brand-emblem" aria-hidden="true">Đ</div>
      <div className="flex items-baseline gap-2 min-w-0">
        <strong className="brand-wordmark whitespace-nowrap">đông a<span>edu</span></strong>
        <span className="hidden lg:inline text-[11px] font-bold text-[#9ca3af] ml-3 pl-4 border-l border-[#e5e5e5]">Học lịch sử vui hơn mỗi ngày!</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-1.5 text-[11px] font-extrabold text-[#79b900] tracking-[.04em]"><Sparkles className="w-4 h-4"/> KHÔNG GIAN HỌC TẬP</div>
      <div className="role-toggle" role="group" aria-label="Chọn vai trò hiển thị">
        <button type="button" aria-pressed={currentRole === 'student'} onClick={() => onRoleChange('student')} className={currentRole === 'student' ? 'is-active' : ''}><GraduationCap className="w-4 h-4"/> Học sinh</button>
        <button type="button" aria-pressed={currentRole === 'teacher'} onClick={() => onRoleChange('teacher')} className={currentRole === 'teacher' ? 'is-active' : ''}><BookOpen className="w-4 h-4"/> Giáo viên</button>
      </div>
    </div>
  </div>
);
