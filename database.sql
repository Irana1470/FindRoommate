-- ============================================================
-- DATABASE: FindRoomMate
-- MySQL Script - Complete Database
-- ============================================================

CREATE DATABASE IF NOT EXISTS FindRoomMate
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE FindRoomMate;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS TinNhan;
DROP TABLE IF EXISTS CuocGoi;
DROP TABLE IF EXISTS DanhGia;
DROP TABLE IF EXISTS BaoCaoNoiDung;
DROP TABLE IF EXISTS BanBe;
DROP TABLE IF EXISTS PhieuTamTru;
DROP TABLE IF EXISTS ChiTietHoaDon;
DROP TABLE IF EXISTS HoaDon;
DROP TABLE IF EXISTS DichVu;
DROP TABLE IF EXISTS ChiTietPhong;
DROP TABLE IF EXISTS YeuCauThamGia;
DROP TABLE IF EXISTS BaiDang;
DROP TABLE IF EXISTS Phong;
DROP TABLE IF EXISTS ViTien;
DROP TABLE IF EXISTS XacThucDanhTinh;
DROP TABLE IF EXISTS NguoiDung;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE NguoiDung (
    maNguoiDung       INT AUTO_INCREMENT PRIMARY KEY,
    hoTen             VARCHAR(100) NOT NULL,
    Email             VARCHAR(100) UNIQUE,
    soDienThoai       VARCHAR(15) UNIQUE,
    matKhau           VARCHAR(255) NOT NULL,
    Avatar            TEXT,
    coverPhoto        TEXT,
    bio               VARCHAR(500),
    noiSong           VARCHAR(150),
    taiKhoanRiengTu   BOOLEAN DEFAULT FALSE,
    role              VARCHAR(20) NOT NULL DEFAULT 'USER',
    xacThuc           BOOLEAN DEFAULT FALSE,
    taiKhoanBiKhoa    BOOLEAN NOT NULL DEFAULT FALSE,
    lyDoKhoaTaiKhoan  VARCHAR(255),
    biHanCheHoatDong  BOOLEAN NOT NULL DEFAULT FALSE,
    lyDoHanCheHoatDong VARCHAR(255),
    canhBaoTaiKhoan   VARCHAR(255),
    hanCheDangBai     BOOLEAN NOT NULL DEFAULT FALSE,
    hanCheTaoPhong    BOOLEAN NOT NULL DEFAULT FALSE,
    hanCheGuiYeuCauPhong BOOLEAN NOT NULL DEFAULT FALSE,
    thoiGianHanCheDen DATETIME NULL,
    ngayTao           DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE XacThucDanhTinh (
    maXacThuc             INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung           INT NOT NULL,
    hoTen                 VARCHAR(512),
    soCanCuocCongDan      VARCHAR(512),
    soCanCuocCongDanHash  VARCHAR(64),
    ngaySinh              VARCHAR(128),
    diaChi                VARCHAR(1024),
    moTa                  VARCHAR(2048),
    CONSTRAINT FK_XacThuc_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX UX_XacThucDanhTinh_SoCanCuocCongDanHash
    ON XacThucDanhTinh(soCanCuocCongDanHash);

CREATE TABLE ViTien (
    maVi          INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung   INT UNIQUE NOT NULL,
    tongTien      DECIMAL(18,2) DEFAULT 0,
    CONSTRAINT FK_ViTien_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Phong (
    maPhong         INT AUTO_INCREMENT PRIMARY KEY,
    maChuPhong      INT NOT NULL,
    maPhongCha      INT NULL,
    Title           VARCHAR(255) NOT NULL,
    giaTien         DECIMAL(18,2),
    tienDichVu      DECIMAL(18,2) DEFAULT 0,
    tienDien        DECIMAL(18,2) DEFAULT 0,
    tienNuoc        DECIMAL(18,2) DEFAULT 0,
    soNguoiToiDa    INT,
    soNguoiHienTai  INT DEFAULT 0,
    tinhThanh       VARCHAR(150),
    quanHuyen       VARCHAR(150),
    diaChi          VARCHAR(255),
    moTa            TEXT,
    trangThai       VARCHAR(50),
    CONSTRAINT FK_Phong_ChuPhong FOREIGN KEY (maChuPhong) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_Phong_PhongCha FOREIGN KEY (maPhongCha) REFERENCES Phong(maPhong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IX_Phong_TinhThanh_QuanHuyen
    ON Phong(tinhThanh, quanHuyen);

CREATE TABLE BaiDang (
    maBaiDang    INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDang  INT NOT NULL,
    maPhong      INT NULL,
    moTa         TEXT,
    noiDung      TEXT,
    giaTien      DECIMAL(18,2),
    tinhThanh    VARCHAR(150),
    quanHuyen    VARCHAR(150),
    diaChi       VARCHAR(255),
    images       TEXT,
    video        VARCHAR(500),
    trangThai    VARCHAR(50),
    soLuotXem    INT DEFAULT 0,
    luotDanhGia  INT DEFAULT 0,
    ngayDang     DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat  DATETIME,
    ngayHetHan   DATETIME,
    CONSTRAINT FK_BaiDang_NguoiDang FOREIGN KEY (maNguoiDang) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_BaiDang_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE YeuCauThamGia (
    maYeuCau     INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung  INT NOT NULL,
    maPhong      INT NOT NULL,
    ngayYeuCau   DATETIME DEFAULT CURRENT_TIMESTAMP,
    moTa         TEXT,
    trangThai    VARCHAR(50),
    CONSTRAINT FK_YeuCau_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_YeuCau_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ChiTietPhong (
    maPhong      INT NOT NULL,
    maNguoiDung  INT NOT NULL,
    ngayThamGia  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (maPhong, maNguoiDung),
    CONSTRAINT FK_ChiTiet_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong),
    CONSTRAINT FK_ChiTiet_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE DichVu (
    maDichVu   INT AUTO_INCREMENT PRIMARY KEY,
    tenDichVu  VARCHAR(100),
    giaTien    DECIMAL(18,2),
    donViTinh  VARCHAR(50),
    moTa       TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE HoaDon (
    maHoaDon             INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung          INT NOT NULL,
    maPhong              INT NOT NULL,
    tongTien             DECIMAL(18,2),
    phuongThucThanhToan  VARCHAR(50),
    moTa                 TEXT,
    ngayTao              DATETIME DEFAULT CURRENT_TIMESTAMP,
    trangThai            VARCHAR(50),
    CONSTRAINT FK_HoaDon_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_HoaDon_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ChiTietHoaDon (
    maChiTietHoaDon  INT AUTO_INCREMENT PRIMARY KEY,
    maHoaDon         INT NOT NULL,
    maDichVu         INT NOT NULL,
    soLuongSuDung    INT,
    thanhTien        DECIMAL(18,2),
    CONSTRAINT FK_CTHD_HoaDon FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    CONSTRAINT FK_CTHD_DichVu FOREIGN KEY (maDichVu) REFERENCES DichVu(maDichVu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PhieuTamTru (
    maPhieuTamTru    INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung      INT NOT NULL,
    maPhong          INT NULL,
    coQuanDangKy     VARCHAR(1024),
    hoTen            VARCHAR(512),
    gioiTinh         VARCHAR(255),
    soCanCuocCongDan VARCHAR(512),
    soDienThoai      VARCHAR(255),
    email            VARCHAR(512),
    ngaySinh         VARCHAR(128),
    tenChuHo         VARCHAR(512),
    quanHeVoiChuHo   VARCHAR(512),
    soDinhDanhChuHo  VARCHAR(512),
    diaChiThuongTru  VARCHAR(1024),
    diaChiTamTru     VARCHAR(1024),
    noiDungDeNghi    VARCHAR(2048),
    ngayBatDau       VARCHAR(128),
    CONSTRAINT FK_TamTru_NguoiDung FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_TamTru_Phong FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE DanhGia (
    maDanhGia            INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDanhGia       INT NOT NULL,
    maHoaDon             INT NULL,
    maNguoiDuocDanhGia   INT NULL,
    moTa                 TEXT,
    soSao                INT CHECK (soSao >= 1 AND soSao <= 5),
    ngayDanhGia          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_DanhGia_NguoiDung FOREIGN KEY (maNguoiDanhGia) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_DanhGia_HoaDon FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    CONSTRAINT FK_DanhGia_NguoiDuocDanhGia FOREIGN KEY (maNguoiDuocDanhGia) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BaoCaoNoiDung (
    maBaoCao         INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiBaoCao    INT NOT NULL,
    maNguoiBiBaoCao  INT NOT NULL,
    loaiDoiTuong     VARCHAR(20) NOT NULL,
    maDoiTuong       INT NOT NULL,
    tieuDeDoiTuong   VARCHAR(255) NOT NULL,
    lyDo             VARCHAR(120) NOT NULL,
    chiTiet          TEXT,
    trangThai        VARCHAR(30) NOT NULL DEFAULT 'NEW',
    ghiChuXuLy       VARCHAR(255),
    ngayTao          DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_BaoCaoNoiDung_NguoiBaoCao FOREIGN KEY (maNguoiBaoCao) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_BaoCaoNoiDung_NguoiBiBaoCao FOREIGN KEY (maNguoiBiBaoCao) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BanBe (
    maBanBe         INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiGui      INT NOT NULL,
    maNguoiNhan     INT NOT NULL,
    trangThai       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ngayTao         DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat     DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_BanBe_NguoiGui FOREIGN KEY (maNguoiGui) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_BanBe_NguoiNhan FOREIGN KEY (maNguoiNhan) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE TinNhan (
    maTinNhan           INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiGui          INT NOT NULL,
    maNguoiNhan         INT NOT NULL,
    conversationId      VARCHAR(64),
    loaiTinNhan         VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    noiDung             TEXT,
    tepUrl              VARCHAR(500),
    tepTenGoc           VARCHAR(255),
    tepMimeType         VARCHAR(120),
    tepKichThuoc        BIGINT,
    trangThai           VARCHAR(20) NOT NULL DEFAULT 'SENT',
    daThuHoi            BOOLEAN NOT NULL DEFAULT FALSE,
    daXoaBoiNguoiGui    BOOLEAN NOT NULL DEFAULT FALSE,
    daChinhSua          BOOLEAN NOT NULL DEFAULT FALSE,
    maTinNhanTraLoi     INT NULL,
    deliveredToJson     TEXT,
    seenByJson          TEXT,
    reactionsJson       TEXT,
    thoiGianGui         DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoiGianCapNhat     DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoiGianDaNhan      DATETIME NULL,
    thoiGianDaXem       DATETIME NULL,
    CONSTRAINT FK_TinNhan_NguoiGui FOREIGN KEY (maNguoiGui) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_TinNhan_NguoiNhan FOREIGN KEY (maNguoiNhan) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_TinNhan_Reply FOREIGN KEY (maTinNhanTraLoi) REFERENCES TinNhan(maTinNhan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IX_TinNhan_MaNguoiGui_MaNguoiNhan_ThoiGian
    ON TinNhan(maNguoiGui, maNguoiNhan, thoiGianGui);
CREATE INDEX IX_TinNhan_MaNguoiNhan_MaNguoiGui_ThoiGian
    ON TinNhan(maNguoiNhan, maNguoiGui, thoiGianGui);

CREATE TABLE CuocGoi (
    maCuocGoi       INT AUTO_INCREMENT PRIMARY KEY,
    callId          VARCHAR(64) NOT NULL UNIQUE,
    maNguoiGoi      INT NOT NULL,
    maNguoiNhan     INT NOT NULL,
    kieuCuocGoi     VARCHAR(20) NOT NULL,
    trangThai       VARCHAR(20) NOT NULL DEFAULT 'RINGING',
    batDauLuc       DATETIME DEFAULT CURRENT_TIMESTAMP,
    ketThucLuc      DATETIME NULL,
    thoiLuongGiay   INT NULL,
    lyDoKetThuc     VARCHAR(50),
    CONSTRAINT FK_CuocGoi_NguoiGoi FOREIGN KEY (maNguoiGoi) REFERENCES NguoiDung(maNguoiDung),
    CONSTRAINT FK_CuocGoi_NguoiNhan FOREIGN KEY (maNguoiNhan) REFERENCES NguoiDung(maNguoiDung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_ThanhToanHoaDon;

DELIMITER //
CREATE PROCEDURE sp_ThanhToanHoaDon(IN p_maHoaDon INT)
BEGIN
    DECLARE v_maNguoiThue INT;
    DECLARE v_maChuPhong INT;
    DECLARE v_soTien DECIMAL(18,2);
    DECLARE v_soDu DECIMAL(18,2);

    SELECT h.maNguoiDung, h.tongTien, p.maChuPhong
    INTO v_maNguoiThue, v_soTien, v_maChuPhong
    FROM HoaDon h
    JOIN Phong p ON h.maPhong = p.maPhong
    WHERE h.maHoaDon = p_maHoaDon;

    SELECT tongTien
    INTO v_soDu
    FROM ViTien
    WHERE maNguoiDung = v_maNguoiThue;

    IF v_soDu >= v_soTien THEN
        START TRANSACTION;
            UPDATE ViTien SET tongTien = tongTien - v_soTien WHERE maNguoiDung = v_maNguoiThue;
            UPDATE ViTien SET tongTien = tongTien + v_soTien WHERE maNguoiDung = v_maChuPhong;
            UPDATE HoaDon
            SET trangThai = 'Da thanh toan',
                phuongThucThanhToan = 'Vi dien tu'
            WHERE maHoaDon = p_maHoaDon;
        COMMIT;
        SELECT 'Thanh toan hoan tat.' AS message;
    ELSE
        SELECT 'So du vi khong du.' AS message;
    END IF;
END//
DELIMITER ;

INSERT INTO DichVu (tenDichVu, giaTien, donViTinh, moTa) VALUES
    ('Tien dien', 3500, 'kWh', 'Gia dien sinh hoat'),
    ('Tien nuoc', 15000, 'm3', 'Gia nuoc sinh hoat'),
    ('Wifi', 100000, 'thang', 'Internet toc do cao'),
    ('Ve sinh', 50000, 'thang', 'Dich vu ve sinh chung');

SELECT 'Database FindRoomMate created successfully!' AS message;
