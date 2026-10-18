# Changelog — Desktop Duolingo-inspired

Phiên bản giao diện desktop mới thay thế palette giấy cổ xanh mực của bản cũ. Thành phần chủ đạo: Nunito, xanh lá #58cc02, xanh dương #1cb0f6, vàng #ffc800, các nút nổi có viền đáy, sidebar sáng và cards bo tròn.

- `src/components/RoleSwitcher.tsx`: thanh thương hiệu và chuyển vai trò.
- `src/components/Sidebar.tsx`: điều hướng giáo viên.
- `src/views/StudentView.tsx`: điều hướng, bảng điểm, lộ trình chặng học, XP/nhiệm vụ, BKT/AI chat.
- `src/views/TeacherView.tsx`: dashboard giáo viên và công cụ.
- `src/views/LibraryView.tsx`, `QuestWorldMapView.tsx`, `QuestDetailMapView.tsx`, `QuizCreatorView.tsx`, `StoryCreatorView.tsx`: đồng bộ tông màu.
- `src/components/StudentQuizModal.tsx`: chỉnh màu và sửa lỗi cộng điểm cuối bài.
- `src/index.css`: design system xuyên suốt.
- `src/App.tsx`: mặc định mở góc nhìn học sinh.

Xem `HUONG_DAN_CHAY_DESKTOP.md` để chạy trên Windows.
