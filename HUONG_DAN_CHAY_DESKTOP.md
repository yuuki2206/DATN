# Đông A EDU — Giao diện desktop lấy cảm hứng từ Duolingo

## 1. Mở giao diện trên Windows (PowerShell)

**Lưu ý:** Sau khi giải nén, tìm thư mục `frontend` (nơi có file `package.json` và `package-lock.json`). Không chạy npm ở thư mục ngoài cùng.

Giả sử PowerShell đang mở tại thư mục vừa giải nén (nơi nhìn thấy `frontend` và `backend`):

```powershell
cd .\frontend
npm ci
npm run dev
```

Mở URL do Vite in ra, thường là: http://localhost:5173/

Nếu `npm ci` báo EUSAGE / thiếu package-lock.json: gõ `dir` kiểm tra; bạn chưa ở đúng thư mục `frontend`.

Nếu `npm ci` báo lỗi mạng / registry: kiểm tra internet và thử `npm install` từ chính thư mục `frontend`.

Yêu cầu: Node.js phiên bản tương thích với Vite 8 (Node.js 20.19+ hoặc 22.12+); khuyến nghị Node 22 LTS.

## 2. Backend AI / BKT (tùy nhu cầu)

Mở **một cửa sổ PowerShell mới**, ở thư mục gốc dự án:

```powershell
cd .\backend
python -m pip install -r requirements.txt
python run.py
```

Backend chạy mặc định tại http://localhost:8000. AI Gemini chỉ hoạt động đầy đủ khi bạn tạo `backend/.env` từ `.env.example` và nhập khóa API hợp lệ. Không đưa khóa API vào ZIP công khai.

## 3. Những thay đổi giao diện

- Desktop mặc định mở góc nhìn **học sinh** để thấy lộ trình giống ứng dụng học tập game hóa.
- Thanh thương hiệu và nút chuyển **Học sinh / Giáo viên** ở phía trên.
- Sidebar trắng với tab hiện tại được đánh dấu xanh dương.
- Trang học sinh: banner chặng, đường học uốn lượn, bài học hiện tại, XP, chuỗi ngày, tim, bảng hạng, nhiệm vụ hằng ngày, trợ lý AI và sa bàn 3D có thể mở khi cần.
- Trang giáo viên: banner vui tươi, chỉ số lớp học, các thẻ công cụ và khu công việc; có thể mở sa bàn 3D.
- Thống nhất màu chủ đạo xanh lá / xanh dương / vàng, viền bo tròn và typography trên thư viện, bộ soạn bài, bản đồ, luyện tập và AI chat.
- Sửa điểm tổng kết quiz: không cộng thừa câu đúng cuối cùng; khi đạt từ 2/3 câu thì giao diện mở chặng tiếp theo trong phiên hiện tại.

## 4. Những gì giữ nguyên

- Backend Python, AI, BKT, cơ sở dữ liệu học liệu dạng JSON/JSONL và API.
- Logic thư viện, bài học, bản đồ nhiệm vụ, câu chuyện, trắc nghiệm và các màn hình tạo học liệu.
- Đây là giao diện **lấy cảm hứng từ** phong cách vui nhộn/game hóa của Duolingo; không dùng logo hoặc hình linh vật của Duolingo.

## 5. Kiểm thử

Đã kiểm tra cú pháp TypeScript/TSX của 46 file và phân tích cú pháp CSS. **Chưa chạy build Vite trọn vẹn** trong môi trường tạo file vì không thể truy cập npm registry. Trên máy có internet, có thể kiểm tra:

```powershell
cd .\frontend
npm ci
npm run build
npm run dev
```

Đồ án hiện đang sử dụng dữ liệu mẫu ở một số màn hình; việc redesign không biến dữ liệu mẫu thành cơ sở dữ liệu thật.
