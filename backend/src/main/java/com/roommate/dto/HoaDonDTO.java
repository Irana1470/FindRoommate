package com.roommate.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class HoaDonDTO {
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer maHoaDon;
        private Integer maNguoiDung;
        private String tenNguoiDung;
        private Integer maPhong;
        private String tenPhong;
        private BigDecimal tongTien;
        private BigDecimal tienPhong;
        private BigDecimal tienDichVu;
        private BigDecimal tienDien;
        private BigDecimal tienNuoc;
        private BigDecimal giaDien;
        private BigDecimal soDien;
        private BigDecimal giaNuoc;
        private BigDecimal soNuoc;
        private String kieuTinhTienNuoc;
        private String phuongThucThanhToan;
        private String moTa;
        private LocalDateTime ngayTao;
        private LocalDateTime ngayThanhToan;
        private String trangThai;
        private List<ChiTietItem> chiTiet;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChiTietItem {
        private String tenDichVu;
        private Integer soLuong;
        private BigDecimal donGia;
        private BigDecimal thanhTien;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TaoHoaDonRequest {
        @NotNull private Integer maPhong;
        private String moTa;
        private List<ChiTietRequest> chiTiet;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ChiTietRequest {
        private Integer maDichVu;
        private Integer soLuong;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ChiaTienThuCongRequest {
        @NotNull private BigDecimal tienPhong;
        @NotNull private BigDecimal tienDichVu;
        @NotNull private BigDecimal tienDien;
        @NotNull private BigDecimal tienNuoc;
        private BigDecimal giaDien;
        private BigDecimal soDien;
        private BigDecimal giaNuoc;
        private BigDecimal soNuoc;
        private String kieuTinhTienNuoc;
        private String moTa;
    }
}
