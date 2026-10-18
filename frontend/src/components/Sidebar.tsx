import React, { useState } from 'react';
import { Home, Compass, FolderOpen, BarChart2, Users, Sparkles, HelpCircle, ChevronLeft, ChevronRight, MapPin, X, BookOpen, Crown } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenAiModal: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenAiModal, mobileOpen = false, onCloseMobile }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = [
    { id: 'home', label: 'Tổng quan', icon: Home },
    { id: 'discover', label: 'Khám phá bài học', icon: Compass },
    { id: 'quests', label: 'Bản đồ nhiệm vụ', icon: MapPin },
    { id: 'library', label: 'Thư viện học liệu', icon: FolderOpen },
    { id: 'reports', label: 'Báo cáo & thống kê', icon: BarChart2 },
    { id: 'groups', label: 'Học sinh & lớp học', icon: Users },
  ];
  const choose = (id: string) => { onSelectTab(id); onCloseMobile?.(); };
  return (
    <>
      {mobileOpen && <button className="fixed inset-0 bg-slate-900/40 z-[65] lg:hidden" onClick={onCloseMobile} aria-label="Đóng menu điều hướng" />}
      <aside className={`app-sidebar mobile-sidepanel flex flex-col justify-between shrink-0 transition-[width,transform] duration-300 ${isCollapsed ? 'lg:w-[90px]' : 'lg:w-[254px]'} w-[260px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}>
        <div>
          <div className="px-4 pt-6 pb-5 flex items-center justify-between gap-2">
            {!isCollapsed && <span className="sidebar-caption">DÀNH CHO GIÁO VIÊN</span>}
            <button className="lg:hidden p-2 text-[#777] rounded-xl" aria-label="Đóng menu" onClick={onCloseMobile}><X className="w-5 h-5" /></button>
            <button className="hidden lg:flex p-2 text-[#777] hover:bg-[#f4f4f4] rounded-xl ml-auto" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>{isCollapsed ? <ChevronRight className="w-5 h-5"/> : <ChevronLeft className="w-5 h-5"/>}</button>
          </div>
          <nav aria-label="Điều hướng giáo viên" className="px-3 space-y-1.5">
            {navItems.map(({id,label,icon:Icon}) => <button key={id} type="button" onClick={() => choose(id)} aria-current={activeTab === id ? 'page' : undefined} title={isCollapsed ? label : undefined} className="app-nav-item w-full flex items-center gap-3 px-3 py-3 text-[13px] font-extrabold tracking-wide">
              <Icon className="w-[21px] h-[21px] shrink-0" strokeWidth={2.5} />{!isCollapsed && <span className="truncate">{label}</span>}
            </button>)}
          </nav>
          <div className="mx-3 mt-5 pt-4 border-t border-[#e9e9e9]">
            <button type="button" onClick={() => {onOpenAiModal(); onCloseMobile?.();}} title="Tạo học liệu AI" className="app-nav-item w-full flex items-center gap-3 px-3 py-3 text-[13px] font-extrabold text-[#8a54d6]">
              <Sparkles className="w-[21px] h-[21px] shrink-0" />{!isCollapsed && <span>Trợ lý AI giáo viên</span>}
            </button>
          </div>
        </div>
        <div className="px-3 pb-6 pt-4 space-y-3">
          {!isCollapsed && <div className="sidebar-promo">
            <div className="text-3xl mb-2" aria-hidden="true">🏆</div>
            <p className="text-[14px] font-extrabold text-[#4b4b4b]">Lan tỏa tình yêu lịch sử!</p>
            <p className="text-[11px] leading-relaxed text-[#818181] mt-1">Mỗi bài học là một hành trình chinh phục mới.</p>
            <div className="mt-3 rounded-full h-2 bg-[#e6e6e6] overflow-hidden"><div className="h-full bg-[#58cc02] w-[72%] rounded-full" /></div>
            <span className="block mt-2 text-[10px] font-bold text-[#58a700]">Tiến độ lớp 7A1 · 72%</span>
          </div>}
          <button onClick={() => choose('help')} className="app-nav-item w-full flex items-center gap-3 px-3 py-3 text-[13px] font-extrabold" title="Trợ giúp & SGK 7"><HelpCircle className="w-[21px] h-[21px] shrink-0" />{!isCollapsed && <span>Trợ giúp & SGK 7</span>}</button>
          {!isCollapsed && <div className="flex items-center gap-2 px-3 text-[10px] text-[#aaa] font-bold"><BookOpen className="w-3.5 h-3.5"/><span>ĐÔNG A EDU • LỊCH SỬ 7</span><Crown className="w-3.5 h-3.5 ml-auto text-[#ffc800]"/></div>}
        </div>
      </aside>
    </>
  );
};
