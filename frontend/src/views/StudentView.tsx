import React, { useState, useRef, useEffect } from 'react';
import {
  LearnMapIcon,
  QuestChestIcon,
  ShopStoreIcon,
  ProfileDashedIcon,
} from '../components/GameIcons';
import {
  Trophy,
  MessageSquare,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Lock,
  Swords,
  ChevronRight,
  Send,
  Heart,
  Flame,
  Gem,
  RotateCcw,
  Menu,
  X,
} from 'lucide-react';
import { StudentQuizModal } from '../components/StudentQuizModal';
import { QuestsModal } from '../components/QuestsModal';
import { ShopModal } from '../components/ShopModal';
import { ProfileModal } from '../components/ProfileModal';
import { QuestWorldMapView } from './QuestWorldMapView';
import {
  CircularCarousel,
  SpotlightCard,
  ShinyText,
  MagneticButton,
  DONG_A_CAROUSEL_ITEMS,
} from '../components/reactbits';
import { API_BASE_URL } from '../config/api';

interface StudentViewProps {
  onShowToast: (msg: string) => void;
}

interface RecommendationItem {
  unit_id: string;
  topic: string;
  category: string;
  current_mastery: number;
  difficulty: number;
  cognitive_level: string;
  reason: string;
}

const renderInlineMarkdown = (line: string): React.ReactNode[] => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const renderFormattedAiText = (rawText: string): React.ReactNode => {
  const lines = rawText.split('\n');
  return (
    <div className="space-y-2.5">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        // Bullet points (*, -, •)
        const bulletMatch = line.match(/^([*\-•])\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div
              key={idx}
              className="flex items-start gap-3 pl-1 py-1.5 px-3 rounded-xl bg-slate-50/90 border border-slate-200/60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div className="text-[13px] leading-relaxed text-slate-700 flex-1">
                {renderInlineMarkdown(bulletMatch[2])}
              </div>
            </div>
          );
        }

        // Numbered lists (1., 2., 3.)
        const numMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (numMatch) {
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200/60"
            >
              <span className="w-5 h-5 rounded-lg bg-slate-900 text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <div className="text-[13px] leading-relaxed text-slate-700 flex-1">
                {renderInlineMarkdown(numMatch[2])}
              </div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-[13.5px] leading-relaxed text-slate-700">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const StudentView: React.FC<StudentViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<
    'learn' | 'quests' | 'bkt_path' | 'shop' | 'profile' | 'leaderboard' | 'ai_chat'
  >('learn');
  const [show3DCarousel, setShow3DCarousel] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Student Game Stats
  const [studentPoints, setStudentPoints] = useState(1450);
  const [studentStreak] = useState(6);
  const [studentHearts] = useState(5);

  // Dynamic Session ID for multi-turn context management
  const [sessionId, setSessionId] = useState<string>('student_session_long');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // BKT Recommendations state
  const [bktRecommendations, setBktRecommendations] = useState<RecommendationItem[]>([]);
  const [isBktLoading, setIsBktLoading] = useState(false);

  const fetchBKTRecommendations = async () => {
    setIsBktLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quiz/recommendations/student_nguyen_van_long?top_k=5`
      );
      if (response.ok) {
        const data = await response.json();
        setBktRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn('Lỗi tải gợi ý BKT:', err);
    } finally {
      setIsBktLoading(false);
    }
  };

  useEffect(() => {
    fetchBKTRecommendations();
  }, []);

  // AI Chat state for Student
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: 'ai' | 'user';
      text: string;
      characterName?: string;
      citation?: string;
    }>
  >([
    {
      sender: 'ai',
      text: 'Chào em Nguyễn Văn Long! Thầy là Trợ lý AI Sử học Đông A. Em có thắc mắc gì về 3 lần kháng chiến chống quân Mông - Nguyên (1258 - 1288) theo SGK Lịch sử 7 không?',
      characterName: 'Trợ lý AI Sử học Đông A',
      citation: 'SGK Lịch sử 7 KNTT & Đại Việt Sử Ký Toàn Thư',
    },
  ]);

  useEffect(() => {
    if (activeTab === 'ai_chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiLoading, activeTab]);

  const navItems = [
    {
      id: 'learn',
      label: 'BÀI HỌC 3D',
      icon: LearnMapIcon,
      badge: '3D Mới',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'bkt_path',
      label: 'LỘ TRÌNH BKT',
      icon: Sparkles,
      badge: 'Cá nhân hóa',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'quests',
      label: 'NHIỆM VỤ',
      icon: QuestChestIcon,
      badge: '3',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'shop',
      label: 'CỬA HÀNG',
      icon: ShopStoreIcon,
    },
    {
      id: 'profile',
      label: 'HỒ SƠ',
      icon: ProfileDashedIcon,
    },
    {
      id: 'leaderboard',
      label: 'BẢNG XẾP HẠNG',
      icon: Trophy,
    },
    {
      id: 'ai_chat',
      label: 'HỎI ĐÁP AI',
      icon: MessageSquare,
      badge: 'AI RAG',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
  ];

  const sendQueryToAi = async (queryText: string) => {
    const userText = queryText.trim();
    if (!userText || isAiLoading) return;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/dong-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          character_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Máy chủ AI phản hồi mã lỗi: ${response.status}`);
      }

      const data = await response.json();
      const primarySource =
        data.grounding_sources && data.grounding_sources.length > 0
          ? data.grounding_sources[0].curriculum_match
          : undefined;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer,
          characterName: data.character_name || 'Trợ lý AI Sử học Đông A',
          citation: primarySource,
        },
      ]);
    } catch (err) {
      console.warn('Lỗi gọi API chat Đông A, chuyển sang phản hồi dự phòng:', err);
      const lowerQ = userText.toLowerCase().trim();
      let aiResponse = '';
      let citation: string | undefined = undefined;

      if (lowerQ.includes('cam') || lowerQ.includes('toản')) {
        aiResponse =
          'Thầy biết rất rõ về Hoài Văn hầu Trần Quốc Toản! Tại hội nghị Bình Than (1282), vì tuổi còn nhỏ nên Quốc Toản không được dự bàn việc quân. Vừa căm thù giặc vừa hờn tủi, chàng đã vô tình bóp nát quả cam vua ban, sau đó về chiêu mộ hơn 1.000 gia nô thêu cờ 6 chữ vàng "Phá cường địch, báo hoàng ân" lập nhiều chiến công hiển hách!';
        citation = 'SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2b, Tr. 68';
      } else if (
        lowerQ.includes('diên hồng') ||
        lowerQ.includes('đánh') ||
        lowerQ.includes('bô lão')
      ) {
        aiResponse =
          'Hội nghị Diên Hồng tổ chức đầu năm 1285 tại Thăng Long. Thượng hoàng Trần Thánh Tông hỏi các bô lão: "Nên đánh hay nên hòa?", muôn người đồng thanh hô vang: "ĐÁNH!", thể hiện khối đại đoàn kết toàn dân tộc.';
        citation = 'SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2b, Tr. 69';
      } else if (
        lowerQ.includes('bạch đằng') ||
        lowerQ.includes('cọc') ||
        lowerQ.includes('1288')
      ) {
        aiResponse =
          'Trận Bạch Đằng (tháng 4/1288) là đỉnh cao nghệ thuật quân sự: Trần Hưng Đạo cho cắm bãi cọc gỗ lim ngầm, lợi dụng quy luật triều dâng rút để nhử địch vào bẫy, tiêu diệt toàn bộ thủy quân của Ô Mã Nhi và Phàn Tiếp!';
        citation = 'SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2c, Tr. 73';
      } else if (
        lowerQ.includes('vườn không') ||
        lowerQ.includes('1258') ||
        lowerQ.includes('đông bộ đầu')
      ) {
        aiResponse =
          'Kế sách "Vườn không nhà trống" được thực hiện triệt để năm 1258: triệt thoái kinh thành Thăng Long khiến kỵ binh Mông Cổ không có lương ăn, rơi vào cảnh đói kiệt và suy sụp sĩ khí, tạo thời cơ để quân Trần phản công tại Đông Bộ Đầu.';
        citation = 'SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2a, Tr. 65 - 66';
      } else {
        aiResponse = `⚠️ Rất tiếc, thầy không tìm thấy dữ liệu lịch sử phù hợp với câu hỏi "${userText}" trong kho bài học 'Ba lần kháng chiến chống quân Mông - Nguyên (1258 - 1288)'.\n\n👉 Em hãy thử hỏi về: Trần Quốc Toản, Trần Hưng Đạo, Hội nghị Diên Hồng, kế sách Vườn không nhà trống hoặc Trận Bạch Đằng nhé!`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponse,
          characterName: 'Trợ lý AI Sử học Đông A',
          citation,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendQueryToAi(chatInput);
  };

  const handleResetChatSession = () => {
    const newId = `student_session_${Date.now()}`;
    setSessionId(newId);
    setChatMessages([
      {
        sender: 'ai',
        text: 'Đã làm mới phiên trò chuyện! Em muốn tìm hiểu về trận đánh hay nhân vật lịch sử nào trong 3 lần kháng chiến chống quân Mông - Nguyên (1258 - 1288)?',
        characterName: 'Trợ lý AI Sử học Đông A',
        citation: 'SGK Lịch sử 7 KNTT & Đại Việt Sử Ký Toàn Thư',
      },
    ]);
    onShowToast('🔄 Đã làm mới ngữ cảnh hội thoại AI!');
  };

  const handleQuizComplete = (score: number) => {
    setStudentPoints((prev) => prev + score * 60);
    if (score >= 2) setLessonFinished(true);
    onShowToast(
      `🎉 Tuyệt vời! Em đã đạt ${score}/3 câu đúng và nhận thêm +${score * 60} điểm!`
    );
  };

  return (
    <div className="page-shell flex flex-1 min-h-0 overflow-hidden font-sans text-slate-800">
      {/* Điều hướng học sinh: phong cách học tập desktop */}
      {mobileMenuOpen && <button className="fixed inset-0 z-[65] lg:hidden bg-slate-900/40" aria-label="Đóng menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`app-sidebar mobile-sidepanel w-[260px] lg:w-[254px] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 flex flex-col justify-between shrink-0 overflow-y-auto`}>
        <div>
          <div className="px-6 pt-8 pb-5 flex items-center justify-between gap-2"><span className="sidebar-caption">HỌC TẬP MỖI NGÀY</span><button type="button" className="lg:hidden p-2 rounded-xl" aria-label="Đóng menu" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
          <nav className="px-3 space-y-1.5" aria-label="Điều hướng học sinh">
            {navItems.map(item => {
              const Icon = item.icon;
              return <button key={item.id} type="button" aria-current={activeTab === item.id ? 'page' : undefined}
                onClick={() => {setActiveTab(item.id as typeof activeTab); if (item.id === 'quests') setIsQuestsModalOpen(true); if (item.id === 'shop') setIsShopModalOpen(true); if (item.id === 'profile') setIsProfileModalOpen(true); setMobileMenuOpen(false);}}
                className="app-nav-item w-full flex items-center gap-3 px-3 py-3 text-[13px] font-extrabold tracking-wide">
                <Icon className="w-[22px] h-[22px] shrink-0"/>
                <span className="flex-1 truncate text-left">{item.id === 'learn' ? 'Học ngay' : item.id === 'bkt_path' ? 'Luyện tập cá nhân' : item.id === 'quests' ? 'Nhiệm vụ' : item.id === 'leaderboard' ? 'Bảng xếp hạng' : item.id === 'shop' ? 'Cửa hàng' : item.id === 'profile' ? 'Hồ sơ của em' : 'Trợ lý AI'}</span>
                {item.id === 'ai_chat' && <span className="duo-nav-new">AI</span>}
              </button>;
            })}
          </nav>
        </div>
        <div className="px-3 pb-6 pt-5 space-y-3">
          <div className="sidebar-promo"><div className="flex items-center justify-between"><span className="text-3xl" aria-hidden="true">🔥</span><span className="text-[#ff9600] font-black text-xl">{studentStreak} ngày</span></div><strong className="block mt-2 text-[13px] text-[#4b4b4b]">Chuỗi ngày chăm chỉ</strong><p className="text-[11px] text-[#888] mt-1 leading-relaxed">Đừng bỏ lỡ bài học hôm nay để giữ ngọn lửa nhé!</p><div className="flex gap-1.5 mt-3">{['T2','T3','T4','T5','T6','T7','CN'].map((d,i)=><span key={d} className={`duo-streak-day ${i<6 ? 'is-done':''}`}>{i<6 ? '✓':d}</span>)}</div></div>
          <button type="button" onClick={() => setIsProfileModalOpen(true)} className="duo-profile-tile"><span className="duo-avatar">L</span><span className="flex-1 min-w-0 text-left"><strong className="block truncate">Nguyễn Văn Long</strong><small>Học sinh · Lớp 7A1</small></span><ChevronRight size={16}/></button>
        </div>
      </aside>

      {/* 2. Main Student Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Thanh thành tích luôn hiển thị trên desktop */}
        <header className="app-header border-b px-4 lg:px-8 py-3 sticky top-0 z-30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-2 text-[#777]" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu"><Menu size={20}/></button>
            <span className="text-[22px]" aria-hidden="true">📜</span>
            <div className="min-w-0"><strong className="block truncate text-[13px] font-black text-[#4b4b4b]">Lịch sử 7 · Hào khí Đông A</strong><span className="hidden sm:block text-[10px] font-bold text-[#aaa]">Ba lần kháng chiến chống Mông – Nguyên</span></div>
          </div>
          <div className="duo-top-stats">
            <div className="duo-top-stat" title="Chuỗi ngày học liên tục"><Flame size={23} className="text-[#ff9600] fill-[#ff9600]"/><b className="text-[#ff9600]">{studentStreak}</b></div>
            <button type="button" onClick={() => setIsShopModalOpen(true)} className="duo-top-stat" title="Điểm XP và quà"><Gem size={23} className="text-[#1cb0f6] fill-[#8cdefd]"/><b className="text-[#1cb0f6]">{studentPoints.toLocaleString()}</b></button>
            <div className="duo-top-stat" title="Năng lượng"><Heart size={23} className="text-[#ff4b4b] fill-[#ff4b4b]"/><b className="text-[#ff4b4b]">{studentHearts}</b></div>
            <button type="button" onClick={() => setIsQuizModalOpen(true)} className="duo-header-cta hidden lg:flex"><Swords size={16}/> HỌC NGAY</button>
          </div>
        </header>

        {activeTab === 'learn' && (
          <main className="duo-home flex-1 w-full max-w-[1220px] mx-auto px-5 lg:px-8 py-7 lg:py-9">
            <div className="duo-content-grid">
              <div className="duo-learning-column min-w-0">
                <div className="duo-greeting">
                  <div>
                    <span className="duo-eyebrow">HÀNH TRÌNH LỊCH SỬ 7</span>
                    <h1>Hôm nay mình học gì nhỉ? <span aria-hidden="true">✌️</span></h1>
                    <p>Mỗi ngày một bài học, mỗi ngày thêm yêu Sử Việt!</p>
                  </div>
                  <span className="duo-greeting-mascot" aria-hidden="true">🐉</span>
                </div>

                <div className="duo-unit-banner">
                  <div className="duo-unit-banner-copy">
                    <span className="duo-unit-label">PHẦN 2 · CHẶNG 3</span>
                    <h2>Hào khí Đông A</h2>
                    <p>Ba lần kháng chiến chống quân Mông – Nguyên</p>
                  </div>
                  <button type="button" className="duo-guide-btn" onClick={() => setActiveTab('bkt_path')}><BookOpen size={17}/> SỔ TAY HỌC TẬP</button>
                  <div className="duo-banner-decoration" aria-hidden="true">✦</div>
                </div>

                <div className="duo-progress-caption">
                  <div className="flex items-center gap-2"><span className="duo-dot"/><strong>CHINH PHỤC LỊCH SỬ</strong></div>
                  <span>{lessonFinished ? '3' : '2'}/4 chặng hoàn thành</span>
                </div>
                <div className="duo-progress-track" role="progressbar" aria-valuenow={lessonFinished ? 75 : 50} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ chương"><span style={{ width: lessonFinished ? '75%' : '50%' }} /></div>

                <div className="duo-path" aria-label="Lộ trình học Bài 13">
                  <svg className="duo-path-line" viewBox="0 0 520 620" preserveAspectRatio="none" aria-hidden="true"><path d="M260 34 C258 90 115 94 138 166 S391 248 353 322 S129 393 166 464 S308 546 260 605" fill="none" stroke="#e6e6e6" strokeWidth="15" strokeLinecap="round" strokeDasharray="1 24"/></svg>
                  <div className="duo-path-stop duo-path-stop--one">
                    <button type="button" onClick={() => onShowToast('✅ Hội nghị Bình Than (1282): Em đã hoàn thành chặng này!')} className="duo-lesson-node duo-node-done" aria-label="Chặng 1 Hội nghị Bình Than đã hoàn thành"><CheckCircle2 size={34} strokeWidth={3}/></button>
                    <div className="duo-path-node-text"><strong>Hội nghị Bình Than</strong><span>Hoàn thành · 3 sao</span></div>
                  </div>
                  <div className="duo-path-stop duo-path-stop--two">
                    <button type="button" onClick={() => onShowToast('✅ Phòng tuyến Vạn Kiếp (1285): Em đã hoàn thành chặng này!')} className="duo-lesson-node duo-node-done" aria-label="Chặng 2 Phòng tuyến Vạn Kiếp đã hoàn thành"><CheckCircle2 size={34} strokeWidth={3}/></button>
                    <div className="duo-path-node-text"><strong>Phòng tuyến Vạn Kiếp</strong><span>Hoàn thành · 3 sao</span></div>
                  </div>
                  <div className="duo-path-stop duo-path-stop--three">
                    <span className="duo-start-label">{lessonFinished ? 'ĐÃ HOÀN THÀNH!' : 'BẮT ĐẦU!'}</span>
                    <button type="button" onClick={() => setIsQuizModalOpen(true)} className={`duo-lesson-node duo-node-current ${lessonFinished ? 'duo-node-done' : ''}`} aria-label="Bắt đầu bài Chương Dương Độ"><Swords size={35} strokeWidth={2.8}/></button>
                    <div className="duo-current-lesson-info"><span className="duo-lesson-badge">BÀI HỌC HÔM NAY</span><strong>Trận Chương Dương Độ</strong><span>1285 · +180 XP đang chờ em</span><button type="button" onClick={() => setIsQuizModalOpen(true)}>HỌC NGAY <ChevronRight size={17}/></button></div>
                  </div>
                  <div className="duo-path-stop duo-path-stop--four">
                    <button type="button" onClick={() => lessonFinished ? setIsQuizModalOpen(true) : onShowToast('🔒 Hoàn thành bài Chương Dương Độ để mở khóa chặng tiếp theo.')} className={`duo-lesson-node ${lessonFinished ? 'duo-node-current' : 'duo-node-locked'}`} aria-label="Chặng 4 Giải phóng Thăng Long"><Lock size={29} strokeWidth={3}/></button>
                    <div className="duo-path-node-text"><strong>Giải phóng Thăng Long</strong><span>{lessonFinished ? 'Đã mở khóa!' : 'Hoàn thành chặng trước để mở khóa'}</span></div>
                  </div>
                  <div className="duo-path-stop duo-path-stop--five">
                    <button type="button" onClick={() => onShowToast('🔒 Sắp mở: Trận Bạch Đằng năm 1288!')} className="duo-lesson-node duo-node-locked" aria-label="Trận Bạch Đằng chưa mở khóa"><Trophy size={30} strokeWidth={2.8}/></button>
                    <div className="duo-path-node-text"><strong>Thử thách Bạch Đằng</strong><span>Chặng tiếp theo · 1288</span></div>
                  </div>
                </div>

                <button type="button" className="duo-next-unit" onClick={() => setActiveTab('quests')}><span className="text-3xl" aria-hidden="true">🗺️</span><span><strong>Khám phá bản đồ chiến dịch</strong><small>Những nhiệm vụ mới đang chờ em!</small></span><ChevronRight size={22}/></button>
                <div className="duo-carousel-section">
                  <div className="flex items-center justify-between gap-3"><div><h3>Sa bàn lịch sử tương tác</h3><p>Xoay và khám phá các trận đánh thời Trần</p></div><button type="button" onClick={() => setShow3DCarousel(v => !v)} className="duo-link-btn">{show3DCarousel ? 'THU GỌN' : 'KHÁM PHÁ'} <ChevronRight size={15}/></button></div>
                  {show3DCarousel && <div className="mt-5"><CircularCarousel items={DONG_A_CAROUSEL_ITEMS} variant="student" primaryActionLabel="Hỏi trợ lý AI về trận đánh" secondaryActionLabel="Luyện tập (+180 XP)" onPrimaryAction={item => { setActiveTab('ai_chat'); sendQueryToAi(item.promptSuggestion || `Hãy kể cho em về ${item.title} (${item.period})`); }} onSecondaryAction={() => setIsQuizModalOpen(true)} /></div>}
                </div>
              </div>

              <aside className="duo-right-rail" aria-label="Thành tích và nhiệm vụ học tập">
                <div className="duo-rail-header"><span>THÀNH TÍCH CỦA EM</span><button type="button" onClick={() => setActiveTab('leaderboard')}>XEM HẠNG <ChevronRight size={14}/></button></div>
                <div className="duo-rail-card duo-league-card">
                  <div className="duo-league-medal" aria-hidden="true">🏆</div>
                  <div><strong>Hạng nhất tuần này!</strong><p>Em đang dẫn đầu lớp 7A1. Tiếp tục phát huy nhé!</p></div>
                  <button type="button" onClick={() => setActiveTab('leaderboard')} className="duo-outline-button">XEM BẢNG XẾP HẠNG</button>
                </div>
                <div className="duo-rail-card duo-quests-card">
                  <div className="duo-rail-title"><span>⚡</span><h3>Nhiệm vụ mỗi ngày</h3></div>
                  <div className="duo-quest-row"><span className="duo-quest-emoji">🎯</span><div><strong>Hoàn thành một bài học</strong><div className="duo-mini-track"><span style={{width: lessonFinished ? '100%' : '0%'}}/></div><small>{lessonFinished ? '1' : '0'}/1 bài học</small></div></div>
                  <div className="duo-quest-row"><span className="duo-quest-emoji">⭐</span><div><strong>Kiếm 50 XP hôm nay</strong><div className="duo-mini-track"><span style={{width: lessonFinished ? '100%' : '64%'}}/></div><small>{lessonFinished ? '50' : '32'}/50 XP</small></div></div>
                  <div className="duo-quest-row"><span className="duo-quest-emoji">🔥</span><div><strong>Duy trì chuỗi ngày học</strong><div className="duo-mini-track"><span style={{width: '83%'}}/></div><small>{studentStreak}/7 ngày</small></div></div>
                  <button type="button" onClick={() => setIsQuestsModalOpen(true)} className="duo-rail-link">XEM TẤT CẢ NHIỆM VỤ <ChevronRight size={15}/></button>
                </div>
                <div className="duo-rail-card duo-ai-card"><div className="duo-ai-illustration" aria-hidden="true">💬</div><div><strong>Bí kíp học Sử cùng AI!</strong><p>Chưa hiểu bài? Trợ lý Đông A luôn sẵn sàng giải thích cho em.</p></div><button type="button" onClick={() => setActiveTab('ai_chat')} className="duo-blue-button">HỎI TRỢ LÝ AI</button></div>
                <div className="duo-rail-card duo-goal-card"><div className="duo-rail-title"><span>💎</span><h3>Kho báu của em</h3></div><p>Em có <b>{studentPoints.toLocaleString()} XP</b> tích lũy, đổi quà siêu thú vị nhé!</p><button type="button" onClick={() => setIsShopModalOpen(true)} className="duo-rail-link">ĐẾN CỬA HÀNG <ChevronRight size={15}/></button></div>
              </aside>
            </div>
          </main>
        )}

        {/* Tab 2: BẢNG XẾP HẠNG (Leaderboard) */}
        {activeTab === 'leaderboard' && (
          <main className="flex-1 p-6 max-w-3xl w-full mx-auto">
            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.12)"
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs"
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
                    🏆
                  </div>
                  <div>
                    <h2 className="font-black text-base text-slate-900">BẢNG XẾP HẠNG LỚP 7A1</h2>
                    <p className="text-xs text-slate-500">Thi đua học tập tuần thứ 4</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Em đang xếp Hạng 1
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Nguyễn Văn Long (Em)', points: studentPoints, streak: 6, isMe: true },
                  { rank: 2, name: 'Trần Quốc Anh', points: 1320, streak: 5, isMe: false },
                  { rank: 3, name: 'Lê Minh Thư', points: 1150, streak: 4, isMe: false },
                  { rank: 4, name: 'Phạm Đức Dũng', points: 980, streak: 3, isMe: false },
                  { rank: 5, name: 'Vũ Hoàng Nam', points: 920, streak: 3, isMe: false },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition hover:scale-[1.01] ${
                      item.isMe
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                          item.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : item.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {item.name}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          Chuỗi {item.streak} ngày học
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-xs text-indigo-700 bg-white px-3 py-1 rounded-full border border-slate-200">
                      {item.points.toLocaleString()} điểm
                    </span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </main>
        )}

        {/* Tab 2.5: BẢN ĐỒ NHIỆM VỤ (Quest World Map) */}
        {activeTab === 'quests' && (
          <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
            <QuestWorldMapView onShowToast={onShowToast} />
          </div>
        )}

        {/* Tab 2.8: LỘ TRÌNH CÁ NHÂN HÓA (Bayesian Knowledge Tracing - BKT) */}
        {activeTab === 'bkt_path' && (
          <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header Card */}
            <div className="bg-[#1cb0f6] text-white rounded-3xl p-6 shadow-xl border border-indigo-700/50 relative overflow-hidden">
              <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <ShinyText text="AI KHẢO THÍ & PHÂN TÍCH NĂNG LỰC" className="text-amber-200" />
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                      Q-Matrix Active
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">
                    LỘ TRÌNH ÔN TẬP CÁ NHÂN HÓA (BKT)
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                    Hệ thống theo dõi tiến trình tri thức của học sinh theo mô hình Bayesian Knowledge Tracing (4 tham số: Prior, Transition, Guess, Slip). Tự động phát hiện các lỗ hổng kiến thức để đề xuất ôn tập trọng tâm.
                  </p>
                </div>

                <MagneticButton
                  onClick={fetchBKTRecommendations}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start md:self-auto shrink-0 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Cập nhật tiến trình</span>
                </MagneticButton>
              </div>

              {/* BKT 4-Parameter Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-700/50 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-200 block">P(L₀) Khởi điểm</span>
                  <strong className="text-sm font-black text-white">30%</strong>
                  <span className="text-[9px] text-indigo-300 block">Xác suất biết ban đầu</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-200 block">P(T) Tiếp thu</span>
                  <strong className="text-sm font-black text-emerald-300">+15%</strong>
                  <span className="text-[9px] text-indigo-300 block">Tăng sau mỗi lượt học</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-200 block">P(G) Đoán mò</span>
                  <strong className="text-sm font-black text-amber-300">25%</strong>
                  <span className="text-[9px] text-indigo-300 block">Xác suất đoán đúng</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-200 block">
                    P(S) Trượt/Sơ suất
                  </span>
                  <strong className="text-sm font-black text-rose-300">10%</strong>
                  <span className="text-[9px] text-indigo-300 block">Sai sót dù đã biết</span>
                </div>
              </div>
            </div>

            {/* Recommendations Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Vùng Kiến Thức Cần Củng Cố Gấp</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      P(L) &lt; 60%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dựa trên kết quả làm bài trắc nghiệm và câu hỏi tương tác gần nhất
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {bktRecommendations.length} chủ điểm ưu tiên
                </span>
              </div>

              {isBktLoading ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                  <Sparkles className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">
                    Đang tính toán ma trận tri thức BKT cho học sinh...
                  </p>
                </div>
              ) : bktRecommendations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-3">
                    🎉
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Xuất sắc! Em đã nắm vững tất cả 32 cụm tri thức
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Toàn bộ các chủ đề trong chương Ba lần kháng chiến chống Mông - Nguyên đều đạt mức độ thành thạo trên 60%.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bktRecommendations.map((rec) => {
                    const masteryPercent = Math.round(rec.current_mastery * 100);
                    const isVeryLow = masteryPercent < 30;

                    const levelBadge =
                      rec.cognitive_level === 'NHAN_BIET'
                        ? { label: 'Nhận biết', color: 'bg-blue-50 text-blue-700 border-blue-200' }
                        : rec.cognitive_level === 'THONG_HIEU'
                        ? {
                            label: 'Thông hiểu',
                            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          }
                        : {
                            label: 'Vận dụng',
                            color: 'bg-purple-50 text-purple-700 border-purple-200',
                          };

                    return (
                      <SpotlightCard
                        key={rec.unit_id}
                        spotlightColor="rgba(99, 102, 241, 0.12)"
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition"
                      >
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${levelBadge.color}`}
                              >
                                Mức độ: {levelBadge.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                Độ khó: {rec.difficulty}
                              </span>
                            </div>

                            <h4 className="font-black text-sm text-slate-900 mb-1.5 leading-snug">
                              {rec.topic}
                            </h4>

                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                              {rec.reason}
                            </p>

                            {/* Mastery Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="font-bold text-slate-600">
                                  Mức độ nắm vững P(L):
                                </span>
                                <strong
                                  className={
                                    isVeryLow
                                      ? 'text-rose-600 font-black'
                                      : 'text-amber-600 font-black'
                                  }
                                >
                                  {masteryPercent}%
                                </strong>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isVeryLow ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${masteryPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={() => {
                                const q = `Thầy giải thích giúp em về: ${rec.topic} với ạ`;
                                setActiveTab('ai_chat');
                                sendQueryToAi(q);
                                onShowToast('💬 Đã gửi câu hỏi ôn tập BKT tới Trợ lý AI Đông A!');
                              }}
                              className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Hỏi Thầy Đông A</span>
                            </button>

                            <button
                              onClick={() => setIsQuizModalOpen(true)}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>Luyện tập</span>
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Tab 3: HỎI ĐÁP AI (Student Chat — Editorial Awwwards Interface) */}
        {activeTab === 'ai_chat' && (
          <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto flex flex-col h-[calc(100vh-130px)]">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] flex-1 flex flex-col overflow-hidden relative">
              {/* Minimalist Architectural Header (No Robot Icon) */}
              <div className="px-6 py-4 border-b border-white/10 bg-[#58cc02] text-white flex items-center justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-20 left-1/3 w-72 h-40 bg-amber-500/10 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                    <h3 className="font-black text-sm sm:text-base tracking-tight text-white">
                      Trợ Lý Sử Học Đông A
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/40 px-2.5 py-0.5 rounded-full">
                      SGK Lịch Sử 7 • KNTT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-4.5">
                    Hệ thống truy xuất và đối chiếu sử liệu chính thống Đại Việt Sử Ký Toàn Thư
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetChatSession}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
                    title="Làm mới ngữ cảnh hội thoại"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Làm mới hội thoại</span>
                  </button>
                </div>
              </div>

              {/* Editorial Conversation Canvas */}
              <div className="flex-1 px-5 sm:px-8 py-6 overflow-y-auto space-y-6 bg-gradient-to-b from-[#f8fafc]/60 via-white to-[#f8fafc]/40">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col animate-slide-up ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.sender === 'ai' && msg.characterName && (
                      <div className="flex items-center gap-2 mb-1.5 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                          {msg.characterName}
                        </span>
                      </div>
                    )}

                    {msg.sender === 'user' ? (
                      <div className="max-w-[80%] px-5 py-3.5 rounded-2xl rounded-tr-xs bg-[#1cb0f6] text-white text-xs sm:text-[13.5px] leading-relaxed font-medium shadow-md shadow-slate-900/10">
                        {msg.text}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[92%] sm:max-w-[86%] p-5 sm:p-6 rounded-3xl rounded-tl-xs shadow-[0_4px_24px_-6px_rgba(15,23,42,0.06)] transition ${
                          msg.text.startsWith('⚠️')
                            ? 'bg-amber-50/90 text-amber-950 border border-amber-200/90'
                            : 'bg-white text-slate-800 border border-slate-200/80'
                        }`}
                      >
                        {renderFormattedAiText(msg.text)}

                        {msg.citation && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/70 font-bold px-3 py-1 rounded-full">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Nguồn đối chiếu: {msg.citation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex items-center gap-3 px-5 py-4 bg-white border border-slate-200/80 rounded-2xl max-w-md text-xs font-medium text-slate-600 shadow-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>
                      Đang truy xuất sử liệu SGK Lịch sử 7 và biên soạn câu trả lời...
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Clean Floating Composer Bar */}
              <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-white/95 backdrop-blur-xl">
                <div className="flex items-center gap-2.5 bg-slate-50/90 hover:bg-slate-50 focus-within:bg-white border border-slate-200/90 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5 rounded-2xl p-1.5 pl-4 transition-all duration-200 shadow-2xs">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isAiLoading}
                    placeholder="Đặt câu hỏi lịch sử Đại Việt thời Trần (1258 – 1288)..."
                    className="flex-1 py-2 bg-transparent text-xs sm:text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="px-5 py-2.5 bg-[#58cc02] hover:bg-[#58a700] disabled:opacity-35 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Gửi</span>
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Modals for Student */}
      <StudentQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onComplete={handleQuizComplete}
      />

      <QuestsModal
        isOpen={isQuestsModalOpen}
        onClose={() => setIsQuestsModalOpen(false)}
      />

      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        userPoints={studentPoints}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
