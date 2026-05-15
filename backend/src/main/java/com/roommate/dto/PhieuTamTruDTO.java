package com.roommate.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public class PhieuTamTruDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Integer maPhieuTamTru;
        private Integer maNguoiDung;
        private String coQuanDangKy;
        private String hoTen;
        private String gioiTinh;
        private String soDienThoai;
        private String email;
        private String soCanCuocCongDan;
        private String ngaySinh;
        private String diaChiThuongTru;
        private String diaChiTamTru;
        private String tenChuHo;
        private String quanHeVoiChuHo;
        private String soDinhDanhChuHo;
        private String noiDungDeNghi;
        private String ngayBatDau;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpsertRequest {
        @Size(max = 100, message = "Ho ten khong duoc vuot qua 100 ky tu")
        private String hoTen;

        @Size(max = 255, message = "Co quan dang ky khong duoc vuot qua 255 ky tu")
        private String coQuanDangKy;

        @Size(max = 20, message = "Gioi tinh khong duoc vuot qua 20 ky tu")
        private String gioiTinh;

        @Pattern(regexp = "^$|^[0-9]{9,12}$", message = "So dinh danh ca nhan phai gom tu 9 den 12 chu so")
        private String soCanCuocCongDan;

        @Pattern(regexp = "^$|^[0-9]{10,11}$", message = "So dien thoai phai gom 10 hoac 11 chu so")
        private String soDienThoai;

        @Pattern(regexp = "^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email khong hop le")
        @Size(max = 255, message = "Email khong duoc vuot qua 255 ky tu")
        private String email;

        @PastOrPresent(message = "Ngay sinh khong duoc lon hon ngay hien tai")
        private LocalDate ngaySinh;

        @Size(max = 100, message = "Ten chu ho khong duoc vuot qua 100 ky tu")
        private String tenChuHo;

        @Size(max = 100, message = "Moi quan he voi chu ho khong duoc vuot qua 100 ky tu")
        private String quanHeVoiChuHo;

        @Pattern(regexp = "^$|^[0-9]{9,12}$", message = "So dinh danh cua chu ho phai gom tu 9 den 12 chu so")
        private String soDinhDanhChuHo;

        @Size(max = 255, message = "Dia chi thuong tru khong duoc vuot qua 255 ky tu")
        private String diaChiThuongTru;

        @Size(max = 255, message = "Dia chi tam tru khong duoc vuot qua 255 ky tu")
        private String diaChiTamTru;

        @Size(max = 500, message = "Noi dung de nghi khong duoc vuot qua 500 ky tu")
        private String noiDungDeNghi;

        private LocalDate ngayBatDau;
    }
}
