import { useState } from 'react';
import type { UserRole } from './types/roles';
import { RoleSwitcher } from './components/RoleSwitcher';
import { TeacherView } from './views/TeacherView';
import { StudentView } from './views/StudentView';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'teacher') {
      showToast('👨‍🏫 Đã chuyển sang giao diện Giảng viên (Quản lý & Điều phối tiết học)');
    } else {
      showToast('🎓 Đã chuyển sang giao diện Học sinh (Lộ trình bài học, làm bài trắc nghiệm)');
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden font-sans bg-white">
      {/* Thanh phân quyền & chuyển đổi góc nhìn Giảng viên / Học sinh */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />

      {/* Hiển thị giao diện tương ứng theo vai trò */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {currentRole === 'teacher' ? (
          <TeacherView onShowToast={showToast} />
        ) : (
          <StudentView onShowToast={showToast} />
        )}
      </div>

      {/* Toast thông báo toàn cục */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[90] max-w-[min(420px,calc(100vw-32px))] bg-[#58cc02] text-white px-5 py-3.5 rounded-[17px] shadow-xl flex items-center gap-3 text-xs font-black border-b-4 border-[#58a700] animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
