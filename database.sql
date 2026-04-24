-- ============================================================
-- DATABASE: FindRoomMate
-- SQL Server Script
-- ============================================================

CREATE DATABASE FindRoomMate;
GO
USE FindRoomMate;
GO

-- 1. Bảng Người Dùng
CREATE TABLE NguoiDung (
    maNguoiDung   INT IDENTITY(1,1) PRIMARY KEY,
    hoTen         NVARCHAR(100) NOT NULL,
    Email         VARCHAR(100) UNIQUE,
    soDienThoai   VARCHAR(15) UNIQUE,
    matKhau       VARCHAR(255) NOT NULL,
    Avatar        NVARCHAR(MAX),
    role          VARCHAR(20) NOT NULL DEFAULT 'USER',
    xacThuc       BIT DEFAULT 0,
    ngayTao       DATETIME DEFAULT GETDATE()
);

-- 2. Xác Thực Danh Tính (OCR)
CREATE TABLE XacThucDanhTinh (
    maXacThuc     INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDung   INT NOT NULL,
    hoTen         NVARCHAR(100),
    ngaySinh      DATE,
    diaChi        NVARCHAR(255),
    anhMatTruoc   NVARCHAR(MAX),
    anhMatSau     NVARCHAR(MAX),
    moTa          NVARCHAR(MAX),
    CONSTRAINT FK_XacThuc_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

-- 3. Ví Tiền
CREATE TABLE ViTien (
    maVi          INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDung   INT UNIQUE NOT NULL,
    tongTien      DECIMAL(18,2) DEFAULT 0,
    CONSTRAINT FK_ViTien_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

-- 4. Phòng
CREATE TABLE Phong (
    maPhong       INT IDENTITY(1,1) PRIMARY KEY,
    maChuPhong    INT NOT NULL,
    maPhongCha    INT NULL,
    Title         NVARCHAR(255) NOT NULL,
    giaTien       DECIMAL(18,2),
    soNguoiToiDa  INT,
    soNguoiHienTai INT DEFAULT 0,
    diaChi        NVARCHAR(255),
    moTa          NVARCHAR(MAX),
    trangThai     NVARCHAR(50),
    CONSTRAINT FK_Phong_ChuPhong FOREIGN KEY (maChuPhong) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_Phong_PhongCha FOREIGN KEY (maPhongCha) REFERENCES Phong(maPhong)
);

-- 5. Bài Đăng
CREATE TABLE BaiDang (
    maBaiDang     INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDang   INT NOT NULL,
    maPhong       INT NULL,
    moTa          NVARCHAR(MAX),
    noiDung       NVARCHAR(MAX),
    giaTien       DECIMAL(18,2),
    diaChi        NVARCHAR(255),
    images        NVARCHAR(MAX),
    trangThai     NVARCHAR(50),
    soLuotXem     INT DEFAULT 0,
    luotDanhGia   INT DEFAULT 0,
    ngayDang      DATETIME DEFAULT GETDATE(),
    ngayCapNhat   DATETIME,
    ngayHetHan    DATETIME,
    CONSTRAINT FK_BaiDang_NguoiDang FOREIGN KEY (maNguoiDang) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_BaiDang_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
);

-- 6. Yêu Cầu Tham Gia
CREATE TABLE YeuCauThamGia (
    maYeuCau      INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDung   INT NOT NULL,
    maPhong       INT NOT NULL,
    ngayYeuCau    DATETIME DEFAULT GETDATE(),
    moTa          NVARCHAR(MAX),
    trangThai     NVARCHAR(50),
    CONSTRAINT FK_YeuCau_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_YeuCau_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
);

-- 7. Chi Tiết Phòng (thành viên)
CREATE TABLE ChiTietPhong (
    maPhong       INT NOT NULL,
    maNguoiDung   INT NOT NULL,
    ngayThamGia   DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (maPhong, maNguoiDung),
    CONSTRAINT FK_ChiTiet_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong),
    CONSTRAINT FK_ChiTiet_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

-- 8. Dịch Vụ
CREATE TABLE DichVu (
    maDichVu      INT IDENTITY(1,1) PRIMARY KEY,
    tenDichVu     NVARCHAR(100),
    giaTien       DECIMAL(18,2),
    donViTinh     NVARCHAR(50),
    moTa          NVARCHAR(MAX)
);

-- 9. Hóa Đơn
CREATE TABLE HoaDon (
    maHoaDon              INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDung           INT NOT NULL,
    maPhong               INT NOT NULL,
    tongTien              DECIMAL(18,2),
    phuongThucThanhToan   NVARCHAR(50),
    moTa                  NVARCHAR(MAX),
    ngayTao               DATETIME DEFAULT GETDATE(),
    trangThai             NVARCHAR(50),
    CONSTRAINT FK_HoaDon_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_HoaDon_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
);

-- 10. Chi Tiết Hóa Đơn
CREATE TABLE ChiTietHoaDon (
    maChiTietHoaDon  INT IDENTITY(1,1) PRIMARY KEY,
    maHoaDon         INT NOT NULL,
    maDichVu         INT NOT NULL,
    soLuongSuDung    INT,
    thanhTien        DECIMAL(18,2),
    CONSTRAINT FK_CTHD_HoaDon FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    CONSTRAINT FK_CTHD_DichVu FOREIGN KEY (maDichVu) REFERENCES DichVu(maDichVu)
);

-- 11. Phiếu Tạm Trú
CREATE TABLE PhieuTamTru (
    maPhieuTamTru    INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDung      INT NOT NULL,
    maPhong          INT NOT NULL,
    hoTen            NVARCHAR(100),
    soDienThoai      VARCHAR(15),
    ngaySinh         DATE,
    diaChiThuongTru  NVARCHAR(255),
    ngayBatDau       DATE,
    CONSTRAINT FK_TamTru_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_TamTru_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
);

-- 12. Đánh Giá
CREATE TABLE DanhGia (
    maDanhGia       INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiDanhGia  INT NOT NULL,
    maHoaDon        INT NULL,
    moTa            NVARCHAR(MAX),
    soSao           INT CHECK (soSao >= 1 AND soSao <= 5),
    ngayDanhGia     DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_DanhGia_NguoiDung FOREIGN KEY (maNguoiDanhGia) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_DanhGia_HoaDon FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon)
);

-- 13. Tin Nhắn (Chat)
CREATE TABLE TinNhan (
    maTinNhan    INT IDENTITY(1,1) PRIMARY KEY,
    maNguoiGui   INT NOT NULL,
    maNguoiNhan  INT NOT NULL,
    noiDung      NVARCHAR(MAX),
    thoiGian     DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TinNhan_NguoiGui FOREIGN KEY (maNguoiGui) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_TinNhan_NguoiNhan FOREIGN KEY (maNguoiNhan) REFERENCES NguoiDung(maNguoiDung)
);

-- ============================================================
-- Stored Procedure: Thanh Toán Hóa Đơn
-- ============================================================
GO
CREATE PROCEDURE sp_ThanhToanHoaDon
    @maHoaDon INT
AS
BEGIN
    DECLARE @v_maNguoiThue INT, @v_maChuPhong INT, @v_soTien DECIMAL(18,2);

    SELECT @v_maNguoiThue = h.maNguoiDung,
           @v_soTien      = h.tongTien,
           @v_maChuPhong  = p.maChuPhong
    FROM HoaDon h
    JOIN Phong p ON h.maPhong = p.maPhong
    WHERE h.maHoaDon = @maHoaDon;

    IF (SELECT tongTien FROM ViTien WHERE maNguoiDung = @v_maNguoiThue) >= @v_soTien
    BEGIN
        BEGIN TRANSACTION;
            UPDATE ViTien SET tongTien = tongTien - @v_soTien WHERE maNguoiDung = @v_maNguoiThue;
            UPDATE ViTien SET tongTien = tongTien + @v_soTien WHERE maNguoiDung = @v_maChuPhong;
            UPDATE HoaDon SET trangThai = N'Da thanh toan', phuongThucThanhToan = N'Vi dien tu'
            WHERE maHoaDon = @maHoaDon;
        COMMIT TRANSACTION;
        PRINT N'Thanh toan hoan tat.';
    END
    ELSE
        PRINT N'So du vi khong du.';
END;
GO

-- ============================================================
-- Seed data mẫu
-- ============================================================
INSERT INTO DichVu (tenDichVu, giaTien, donViTinh, moTa) VALUES
    (N'Tiền điện', 3500, N'kWh', N'Giá điện sinh hoạt'),
    (N'Tiền nước', 15000, N'm3', N'Giá nước sinh hoạt'),
    (N'Wifi', 100000, N'tháng', N'Internet tốc độ cao'),
    (N'Vệ sinh', 50000, N'tháng', N'Dịch vụ vệ sinh chung');
GO
