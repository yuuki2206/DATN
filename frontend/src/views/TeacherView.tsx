import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import {
  Sparkles,
  Compass,
  BookOpen,
  BarChart2,
  ChevronRight,
  Play,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Search,
  Eye,
  ArrowRight,
  Bell,
  Layers,
  Menu,
} from 'lucide-react';
import { AiQuizModal } from '../components/AiQuizModal';
import { TextbookModal } from '../components/TextbookModal';
import { CreateDropdown } from '../components/CreateDropdown';
import { QuizCreatorView } from './QuizCreatorView';
import { StoryCreatorView } from './StoryCreatorView';
import { LibraryView } from './LibraryView';
import { QuestWorldMapView } from './QuestWorldMapView';
import { TodoListModal } from '../components/TodoListModal';
import type { TodoTask } from '../components/TodoListModal';
import { initialFolders } from '../data/libraryMockData';
import type { QuizItem, StoryItem } from '../types/library';
import {
  CircularCarousel,
  SpotlightCard,
  TiltedCard,
  MagneticButton,
  DONG_A_CAROUSEL_ITEMS,
} from '../components/reactbits';

const initialTodoTasks: TodoTask[] = [
  {
    id: '1',
    title: 'Xem báo cáo cho Bài 13: Ba lần kháng chiến chống quân Mông - Nguyên',
    description: 'Kiểm tra kết quả làm bài của lớp 7A1 để đánh giá mức độ hiểu bài của học sinh.',
    category: 'report',
    status: 'active',
    actionLabel: 'Xem báo cáo',
    actionType: 'report',
  },
  {
    id: '2',
    title: 'Khám phá 3 câu hỏi trắc nghiệm AI đề xuất cho lớp 7A1',
    description: 'Phân biệt Hội nghị Bình Than (1282 - Quả cam vua ban) và Hội nghị Diên Hồng (1285 - Tiếng hô Đánh).',
    category: 'ai',
    status: 'active',
    actionLabel: 'Tạo trắc nghiệm AI',
    actionType: 'ai',
  },
  {
    id: '3',
    title: 'Chuẩn bị bài giảng Chặng Chương Dương Độ (Năm 1285)',
    description: 'Xem trước 10 câu hỏi trắc nghiệm và tư liệu chiến thuật phản công mùa hè năm 1285.',
    category: 'lesson',
    status: 'active',
    actionLabel: 'Bắt đầu bài giảng',
    actionType: 'lesson',
  },
  {
    id: '4',
    title: 'Xuất bảng điểm lớp 7A1 định dạng Excel (.xlsx)',
    description: 'Tải file tổng kết điểm số của 35 học sinh theo tiêu chuẩn đánh giá của nhà trường.',
    category: 'excel',
    status: 'active',
    actionLabel: 'Xuất Excel',
    actionType: 'excel',
  },
  {
    id: '5',
    title: 'Tạo câu chuyện học liệu tương tác về Hưng Đạo Đại Vương',
    description: 'Xây dựng câu chuyện đa phương tiện với hình ảnh và tư liệu lịch sử Đông A.',
    category: 'assignment',
    status: 'active',
    actionLabel: 'Tạo câu chuyện',
    actionType: 'library',
  },
  {
    id: '6',
    title: 'Gửi thông báo ôn tập tuần tới 35 học sinh lớp 7A1',
    description: 'Gửi đường link ôn tập và lịch kiểm tra 15 phút tuần này đến phụ huynh và học sinh.',
    category: 'assignment',
    status: 'active',
    actionLabel: 'Gửi thông báo',
    actionType: 'profile',
  },
  {
    id: '7',
    title: 'Cập nhật hồ sơ',
    description: 'Hoàn thiện thông tin còn thiếu trên hồ sơ của bạn.',
    category: 'profile',
    status: 'completed',
    actionLabel: 'Cập nhật',
    actionType: 'profile',
  },
];

interface TeacherViewProps {
  onShowToast: (msg: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCourseTab, setActiveCourseTab] = useState<'session' | 'course'>('session');
  const [show3DCarousel, setShow3DCarousel] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTextbookModalOpen, setIsTextbookModalOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState(false);
  const [tasks, setTasks] = useState<TodoTask[]>(initialTodoTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'active' : 'completed';
          onShowToast(
            nextStatus === 'completed'
              ? `✅ Đã hoàn thành: "${t.title}"`
              : `🔄 Đã đưa lại vào danh sách cần làm: "${t.title}"`
          );
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleSkipTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          onShowToast(`⏩ Đã bỏ qua đầu việc: "${t.title}"`);
          return { ...t, status: 'skipped' };
        }
        return t;
      })
    );
  };

  const handleRestoreTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          onShowToast(`↩️ Đã khôi phục đầu việc: "${t.title}"`);
          return { ...t, status: 'active' };
        }
        return t;
      })
    );
  };

  const handleExecuteAction = (actionType?: string) => {
    switch (actionType) {
      case 'profile':
        onShowToast('👤 Hồ sơ giảng viên: ThS. Nguyễn Văn Long - Tổ Lịch sử (Đã hoàn thiện)');
        break;
      case 'report':
        handleExportExcel();
        break;
      case 'ai':
        setIsTodoListModalOpen(false);
        setIsAiModalOpen(true);
        break;
      case 'lesson':
        handleLaunchLesson();
        break;
      case 'excel':
        handleExportExcel();
        break;
      case 'library':
        setIsTodoListModalOpen(false);
        setIsCreateStoryOpen(true);
        break;
      default:
        onShowToast('👍 Thao tác đã được thực hiện thành công.');
    }
  };

  const handleLaunchLesson = (title = 'Bài 13: Ba lần kháng chiến chống quân Mông - Nguyên') => {
    onShowToast(`🚀 ĐÃ BẮT ĐẦU BÀI GIẢNG: "${title}"! Học sinh lớp 7A1 có thể truy cập.`);
  };

  const handleExportExcel = () => {
    onShowToast('📥 Đang xuất file: BangDiem_Lop_7A1_LichSu7.xlsx (Chuẩn GDPT 2018)...');
  };

  const handleSaveQuizFromHeader = (newQuiz: QuizItem) => {
    onShowToast(`🎯 Đã tạo bộ Quiz: "${newQuiz.title}"`);
    setActiveTab('library');
  };

  const handleSaveStoryFromHeader = (newStory: StoryItem) => {
    onShowToast(`📖 Đã tạo câu chuyện: "${newStory.title}"`);
    setActiveTab('library');
  };

  return (
    <div className="page-shell flex flex-1 min-h-0 overflow-hidden font-sans text-slate-800">
      {/* 1. Sidebar bên trái */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId === 'quests') {
            onShowToast('🗺️ Đã mở Bản đồ Nhiệm vụ (Hành trình Tháp Pha Lê & Khám phá).');
          } else if (tabId === 'library') {
            onShowToast('📚 Đã mở Thư viện học liệu (Quiz, Câu chuyện & Thư mục)');
          } else if (tabId === 'ai_tools') {
            setIsAiModalOpen(true);
          } else if (tabId === 'reports') {
            handleExportExcel();
          } else if (tabId === 'groups') {
            onShowToast('👥 Lớp 7A1: 35 học sinh đã được kết nối hệ thống.');
          } else if (tabId === 'discover') {
            setActiveTab('home');
            setShow3DCarousel(true);
            onShowToast('🧭 Đã bật Sa bàn 3D Circular Carousel: Bài 13 - Ba lần kháng chiến chống quân Mông - Nguyên.');
          }
        }}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* 2. Vùng nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header trên cùng */}
        <header className="app-header border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" className="lg:hidden p-2 -ml-1 rounded-lg text-[#214639] hover:bg-[#f0e7d8]" aria-label="Mở menu" onClick={() => setMobileMenuOpen(true)}><Menu className="w-5 h-5" /></button>
            <h1 className="text-[13px] sm:text-[14px] font-extrabold text-[#253a31] tracking-tight truncate">
              {activeTab === 'library'
                ? 'Thư viện Học liệu Số'
                : activeTab === 'quests'
                ? 'Bản đồ Nhiệm vụ (Quests)'
                : 'Bảng điều khiển Giảng viên'}
            </h1>
            <span className="hidden sm:inline-flex bg-[#eef0e5] text-[#47634e] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#d6dfd1]">
              Lớp 7A1
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Search Bar */}
            <div className="relative w-64 hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài giảng, câu hỏi, tài liệu..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205344]/20 transition"
              />
            </div>

            {/* Toggle 3D Circular Carousel button */}
            {activeTab === 'home' && (
              <button
                type="button"
                onClick={() => setShow3DCarousel((v) => !v)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition select-none ${
                  show3DCarousel
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{show3DCarousel ? 'Đang bật Sa bàn 3D' : 'Mở Sa bàn 3D'}</span>
              </button>
            )}

            {/* Nút Nâng cấp */}
            <div
              onClick={() => onShowToast('⭐ Bạn đang dùng phiên bản Đông A EDU Studio 3D cao cấp.')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-3 py-1.5 rounded-xl cursor-pointer transition select-none shadow-2xs"
            >
              <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] font-bold">
                ★
              </div>
              <span>PRO</span>
            </div>

            {/* Nút "Tạo" kèm menu thả xuống */}
            <CreateDropdown
              onCreateQuiz={() => setIsCreateQuizOpen(true)}
              onCreateStory={() => setIsCreateStoryOpen(true)}
              onCreateCourse={() => {
                setActiveTab('library');
                onShowToast('🎓 Đã chuyển đến mục Khoá học trong Thư viện.');
              }}
            />

            {/* Avatar Giáo viên */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Thầy Nguyễn Văn Long"
                className="w-8 h-8 rounded-full border-2 border-amber-500/80 object-cover cursor-pointer hover:ring-2 hover:ring-purple-400 transition"
                title="Tài khoản giáo viên"
              />
              <div className="text-left hidden xl:block leading-tight">
                <span className="text-xs font-bold text-slate-800 block">
                  Thầy Nguyễn Văn Long
                </span>
                <span className="text-[10px] text-slate-500">Giáo viên phụ trách</span>
              </div>
            </div>

            {/* Biểu tượng thông báo */}
            <button
              onClick={() => onShowToast('🔔 Bạn không có thông báo mới.')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* 3. Hiển thị nội dung theo Tab */}
        {activeTab === 'quests' ? (
          <QuestWorldMapView onShowToast={onShowToast} />
        ) : activeTab === 'library' ? (
          <LibraryView
            onShowToast={onShowToast}
            onOpenAiQuizModal={() => setIsAiModalOpen(true)}
            onLaunchLesson={handleLaunchLesson}
          />
        ) : (
          /* GIAO DIỆN TRANG CHỦ DASHBOARD GIẢNG VIÊN NÂNG CẤP (ReactBits + Awwwards) */
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1480px] w-full mx-auto space-y-7 overflow-y-auto">
            <section className="duo-teacher-hero animate-slide-up">
              <div className="duo-teacher-hero-copy">
                <span className="duo-teacher-eyebrow">👋 CHÀO MỪNG THẦY CÔ TRỞ LẠI!</span>
                <h2>Học Sử thật vui,<br/><span>dạy Sử thật hay!</span></h2>
                <p>Khơi dậy hào khí Đông A qua những bài học tương tác, trò chơi và trợ lý AI thông minh.</p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button type="button" onClick={() => setIsAiModalOpen(true)} className="duo-white-button"><Sparkles size={18}/> TẠO BÀI HỌC AI</button>
                  <button type="button" onClick={() => setActiveTab('library')} className="duo-outline-white-button"><BookOpen size={18}/> THƯ VIỆN HỌC LIỆU</button>
                </div>
              </div>
              <div className="duo-teacher-art" aria-hidden="true"><span className="duo-teacher-spark-one">✦</span><span className="duo-teacher-art-emoji">📚</span><span className="duo-teacher-spark-two">✳</span><span className="duo-teacher-art-dragon">🐉</span></div>
            </section>

            <section aria-label="Tổng quan lớp học" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="stat-tile stat-tile-blue"><div className="stat-icon">👩‍🎓</div><div className="stat-kicker">Học sinh trong lớp</div><strong>35 <small>học sinh</small></strong></div>
              <div className="stat-tile stat-tile-green"><div className="stat-icon">✅</div><div className="stat-kicker">Đã hoàn thành bài tập</div><strong>32/35 <small>lượt học</small></strong></div>
              <div className="stat-tile stat-tile-yellow"><div className="stat-icon">🎯</div><div className="stat-kicker">Tỷ lệ trả lời đúng</div><strong>85% <small>bài gần nhất</small></strong></div>
              <div className="stat-tile stat-tile-purple"><div className="stat-icon">🏆</div><div className="stat-kicker">Hành trình khám phá</div><strong>13 <small>chặng</small></strong></div>
            </section>

            {/* ReactBits 3D Circular Carousel cho Giảng viên */}
            {show3DCarousel && (
              <CircularCarousel
                items={DONG_A_CAROUSEL_ITEMS}
                variant="teacher"
                primaryActionLabel="Soạn câu hỏi AI chuyên đề này"
                secondaryActionLabel="Trình chiếu giảng dạy"
                onPrimaryAction={(item) => {
                  setIsAiModalOpen(true);
                  onShowToast(`✨ Đang mở Trình tạo câu hỏi AI cho chuyên đề: "${item.title}"`);
                }}
                onSecondaryAction={(item) => {
                  handleLaunchLesson(`${item.title} (${item.period})`);
                }}
              />
            )}

            {/* Hàng 4 thẻ công cụ cho nhà giáo dục với ReactBits TiltedCard 3D */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                <div><p className="app-section-label mb-1.5">KHÔNG GIAN LÀM VIỆC</p><h3 className="font-editorial font-bold text-[#3c3c3c] text-[22px]">Công cụ dành cho thầy cô</h3></div>
                <span className="text-[11px] text-[#7b8577] font-medium">Chọn một công cụ để bắt đầu <ArrowRight className="inline w-3.5 h-3.5" /></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Thẻ 1: Trình tạo AI */}
                <TiltedCard
                  onClick={() => setIsAiModalOpen(true)}
                  className="duo-tool-card duo-tool-purple p-5 cursor-pointer group"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="duo-tool-icon flex items-center justify-center mb-3">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-[14px] text-[#4b4b4b] mb-1">Trình tạo AI</h4>
                      <p className="text-[11px] text-[#888] leading-[1.6] line-clamp-2">
                        Tiết kiệm thời gian và tạo đề trắc nghiệm bằng AI chuẩn SGK 7.
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-[#1cb0f6] flex items-center gap-1 group-hover:translate-x-1 transition">
                      Bắt đầu ngay <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </TiltedCard>

                {/* Thẻ 2: Khám phá Bản đồ Nhiệm vụ */}
                <TiltedCard
                  onClick={() => setActiveTab('quests')}
                  className="duo-tool-card duo-tool-yellow p-5 cursor-pointer group"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="duo-tool-icon flex items-center justify-center mb-3">
                        <Compass className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-[14px] text-[#4b4b4b] mb-1">Bản đồ Nhiệm vụ</h4>
                      <p className="text-[11px] text-[#888] leading-[1.6] line-clamp-2">
                        Khám phá hành trình 13 ải Tháp Pha Lê và theo dõi tiến độ cả lớp.
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-[#1cb0f6] flex items-center gap-1 group-hover:translate-x-1 transition">
                      Mở bản đồ <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </TiltedCard>

                {/* Thẻ 3: Thư viện Sử liệu */}
                <TiltedCard
                  onClick={() => setActiveTab('library')}
                  className="duo-tool-card duo-tool-blue p-5 cursor-pointer group"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="duo-tool-icon flex items-center justify-center mb-3">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-[14px] text-[#4b4b4b] mb-1">Thư viện Sử liệu</h4>
                      <p className="text-[11px] text-[#888] leading-[1.6] line-clamp-2">
                        Tra cứu nhanh bài Quiz, câu chuyện và thư mục tài liệu.
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-[#1cb0f6] flex items-center gap-1 group-hover:translate-x-1 transition">
                      Mở thư viện <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </TiltedCard>

                {/* Thẻ 4: Báo cáo Lớp học */}
                <TiltedCard
                  onClick={handleExportExcel}
                  className="duo-tool-card duo-tool-green p-5 cursor-pointer group"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="duo-tool-icon flex items-center justify-center mb-3">
                        <BarChart2 className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-[14px] text-[#4b4b4b] mb-1">Báo cáo lớp học</h4>
                      <p className="text-[11px] text-[#888] leading-[1.6] line-clamp-2">
                        Theo dõi tỷ lệ đúng/sai và mức độ hiểu bài của 35 học sinh.
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-[#1cb0f6] flex items-center gap-1 group-hover:translate-x-1 transition">
                      Xem báo cáo <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </TiltedCard>
              </div>
            </div>

            {/* Danh sách việc cần làm với SpotlightCard */}
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.08)"
              className="surface-card p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Danh sách việc cần làm
                  </h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    • {tasks.filter((t) => t.status === 'completed').length}/
                    {tasks.filter((t) => t.status !== 'skipped').length} đầu việc đã hoàn tất
                  </span>
                </div>
                <button
                  onClick={() => setIsTodoListModalOpen(true)}
                  className="text-xs font-bold text-[#205344] hover:underline"
                >
                  Xem tất cả các đầu việc
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks
                  .filter((t) => t.status !== 'skipped')
                  .slice(0, 4)
                  .map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2.5 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition shrink-0 ${
                              isDone
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 bg-white hover:border-[#205344]'
                            }`}
                            title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <h4
                              className={`font-bold text-xs truncate ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <p
                              className={`text-[11px] truncate ${
                                isDone ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {task.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteAction(task.actionType)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#205344] hover:text-white text-slate-500 flex items-center justify-center transition shrink-0"
                          title={task.actionLabel || 'Chi tiết'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </SpotlightCard>

            {/* Khối dưới cùng: 2 Cột (Cột trái bài giảng chính, Cột phải tạo bài mới & báo cáo) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cột trái 8 phần: Phiên khoá học & Bài giảng của bạn */}
              <SpotlightCard
                spotlightColor="rgba(70, 23, 143, 0.08)"
                className="lg:col-span-8 surface-card p-5"
              >
                {/* Tab Header */}
                <div className="flex items-center gap-4 border-b border-slate-200 pb-2 mb-4 text-xs font-bold">
                  <button
                    onClick={() => setActiveCourseTab('session')}
                    className={`pb-2 transition border-b-2 ${
                      activeCourseTab === 'session'
                        ? 'border-[#205344] text-[#205344] font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Bài giảng của bạn
                  </button>
                  <button
                    onClick={() => setActiveCourseTab('course')}
                    className={`pb-2 transition border-b-2 ${
                      activeCourseTab === 'course'
                        ? 'border-[#205344] text-[#205344] font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lộ trình 4 chặng
                  </button>
                </div>

                {/* Main Lesson Card */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                        Lịch sử 7 • Kết nối tri thức
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                        Bài 13: Ba lần kháng chiến chống quân Mông - Nguyên (1258 - 1288)
                      </h4>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      Sẵn sàng giảng dạy
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Bộ câu hỏi trắc nghiệm tương tác kiểm tra kiến thức về Hội nghị Bình Than, Vạn Kiếp, chiến thắng Chương Dương Độ và giải phóng Thăng Long.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#205344]" />
                      Lớp 7A1 (35 học sinh)
                    </span>
                    <span>•</span>
                    <span>10 câu trắc nghiệm</span>
                    <span>•</span>
                    <span>Thời lượng: 12 phút</span>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200">
                    <MagneticButton
                      onClick={() => handleLaunchLesson()}
                      className="primary-cta flex items-center gap-2 px-5 py-2.5 text-xs"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Bắt đầu bài giảng</span>
                    </MagneticButton>

                    <button
                      onClick={() => {
                        setActiveTab('library');
                        onShowToast('📚 Đã chuyển đến Thư viện để xem danh sách câu hỏi.');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xem trong Thư viện</span>
                    </button>

                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#205344] rounded-xl text-xs font-bold transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Tạo đề bằng AI</span>
                    </button>
                  </div>
                </div>
              </SpotlightCard>

              {/* Cột phải 4 phần: Tạo bài mới & Báo cáo mới nhất */}
              <div className="lg:col-span-4 space-y-4">
                {/* Box 1: Tạo bài trắc nghiệm mới */}
                <SpotlightCard
                  spotlightColor="rgba(19, 104, 206, 0.1)"
                  className="surface-card p-5 text-center"
                >
                  <h4 className="font-extrabold text-xs text-slate-900 mb-1">
                    Bài giảng của bạn
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                    Tạo bài trắc nghiệm lịch sử mới bằng một trong các mẫu có sẵn hoặc bằng AI.
                  </p>
                  <button
                    onClick={() => setIsCreateQuizOpen(true)}
                    className="primary-cta w-full py-2.5 text-xs"
                  >
                    Tạo bài giảng mới
                  </button>
                </SpotlightCard>

                {/* Box 2: Báo cáo mới nhất */}
                <SpotlightCard
                  spotlightColor="rgba(16, 185, 129, 0.1)"
                  className="surface-card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-extrabold text-xs text-slate-900">
                      Báo cáo mới nhất
                    </h4>
                    <button
                      onClick={handleExportExcel}
                      className="text-[11px] font-bold text-[#205344] hover:underline"
                    >
                      Xem tất cả (1)
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">
                        Lớp 7A1 - Kháng chiến 1285
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Đúng 85%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      32 / 35 học sinh đã hoàn thành bài tập
                    </p>
                    <button
                      onClick={handleExportExcel}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xuất file Excel</span>
                    </button>
                  </div>
                </SpotlightCard>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Interactive Modals */}
      <AiQuizModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaveQuestions={(count) => {
          setIsAiModalOpen(false);
          onShowToast(`✅ Đã thêm ${count} câu hỏi trắc nghiệm mới vào Bài 13!`);
        }}
      />

      {isCreateQuizOpen && (
        <QuizCreatorView
          folders={initialFolders}
          onSaveQuiz={handleSaveQuizFromHeader}
          onExit={() => setIsCreateQuizOpen(false)}
          onOpenAiGenerator={() => {
            setIsCreateQuizOpen(false);
            setIsAiModalOpen(true);
          }}
          onShowToast={onShowToast}
        />
      )}

      {isCreateStoryOpen && (
        <StoryCreatorView
          folders={initialFolders}
          onSaveStory={handleSaveStoryFromHeader}
          onExit={() => setIsCreateStoryOpen(false)}
          onShowToast={onShowToast}
        />
      )}

      <TextbookModal
        isOpen={isTextbookModalOpen}
        onClose={() => setIsTextbookModalOpen(false)}
        pageNumber={68}
      />

      {/* Modal Danh sách việc cần làm */}
      <TodoListModal
        isOpen={isTodoListModalOpen}
        onClose={() => setIsTodoListModalOpen(false)}
        tasks={tasks}
        onToggleComplete={toggleTask}
        onSkipTask={handleSkipTask}
        onRestoreTask={handleRestoreTask}
        onExecuteAction={handleExecuteAction}
      />
    </div>
  );
};
