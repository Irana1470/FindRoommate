package com.roommate.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public class PhongDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer maPhong;
        private Integer maChuPhong;
        private String tenChuPhong;
        private String avatarChuPhong;
        private Integer maPhongCha;
        private String title;
        private BigDecimal giaTien;
        private BigDecimal tienDichVu;
        private BigDecimal tienDien;
        private BigDecimal tienNuoc;
        private Integer soNguoiToiDa;
        private Integer soNguoiHienTai;
        private String tinhThanh;
        private String quanHuyen;
        private String diaChi;
        private String diaChiDayDu;
        private String moTa;
        private String trangThai;
        private List<ThanhVienDTO> danhSachThanhVien;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TaoPhongRequest {
        @NotBlank private String title;
        @NotNull private BigDecimal giaTien;
        private BigDecimal tienDichVu;
        private BigDecimal tienDien;
        private BigDecimal tienNuoc;
        @NotNull @Min(1) private Integer soNguoiToiDa;
        @NotBlank private String tinhThanh;
        @NotBlank private String quanHuyen;
        @NotBlank private String diaChi;
        private String moTa;
        private Integer maPhongCha;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatPhongRequest {
        private String title;
        private BigDecimal giaTien;
        private BigDecimal tienDichVu;
        private BigDecimal tienDien;
        private BigDecimal tienNuoc;
        private Integer soNguoiToiDa;
        private String tinhThanh;
        private String quanHuyen;
        private String diaChi;
        private String moTa;
        private String trangThai;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ThanhVienDTO {
        private Integer maNguoiDung;
        private String hoTen;
        private String avatar;
        private String ngayThamGia;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BoDLocRequest {
        private BigDecimal giaTienMin;
        private BigDecimal giaTienMax;
        private String tinhThanh;
        private String quanHuyen;
        private String diaChi;
        private Integer soNguoi;
    }
}
