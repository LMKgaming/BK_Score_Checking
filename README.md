# BK Score Checker
Phần mềm xem điểm tổng kết & điểm thành phần sớm & chính xác dành cho sinh viên HCMUT.

# Why using this app?
MyBK hiện nay có 2 hệ thống bảng điểm song song, một cũ một mới, trong đó hệ thống mà sinh viên có thể xem được thông qua MyBK là hệ thống mới. Tuy nhiên, hệ thống mới thường hiển thị điểm trễ hơn so với hệ thống cũ. Ứng dụng này khai thác API của hệ thống bảng điểm cũ để sinh viên xem được điểm tổng kết môn sớm nhất.

# Hướng dẫn cài đặt
## Yêu cầu
Người dùng phải cài đặt sẵn Git và NodeJS. Chi tiết xem tại: https://git-scm.com/install/ và https://nodejs.org/en/download/current
## Cài đặt
1. Clone repository này về máy
    - Mở terminal tại thư mục muốn cài đặt BKSC
    - Chạy lệnh `git clone https://github.com/LMKgaming/BK_Score_Checking.git`. Hệ thống tạo ra thư mục BK_Score_Checking
    - Cho terminal đi vào trong thư mục
2. Chạy lệnh `npm install` (hoặc `npm i`) để tự động cài đặt dependency.
## Sử dụng
1. Chạy lệnh `npm start` để khởi động.
2. Điền thông tin theo hướng dẫn của hệ thống. Lưu ý: không dùng dấu cách.

# Sử dụng thông tin cá nhân
Ứng dụng này không lưu trữ bất kỳ thông tin nào được nhập vào hoặc xuất ra. BKNetID và mật khẩu chỉ được sử dụng một lần để truy cập thông tin điểm số, ngoài ra không có mục đích nào khác.