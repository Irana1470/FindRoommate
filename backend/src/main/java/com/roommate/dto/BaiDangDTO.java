package com.roommate.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

public class BaiDangDTO {
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer maBaiDang;
        private Integer maNguoiDang;
        private String tenNguoiDang;
        private String avatarNguoiDang;
        private Integer maPhong;
        private String tenPhong;
        private Integer soNguoiHienTaiPhong;
        private Integer soNguoiToiDaPhong;
        private String trangThaiPhong;
        private String moTa;
        private String noiDung;
        private BigDecimal giaTien;
        private String tinhThanh;
        private String quanHuyen;
        private String diaChi;
        private List<String> images;
        private String video;
        private String trangThai;
        private Integer soLuotXem;
        private LocalDateTime ngayDang;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MediaUploadResponse {
        private List<String> images;
        private String video;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TaoBaiDangRequest {
        @NotBlank private String moTa;
        private String noiDung;
        @NotNull private BigDecimal giaTien;
        @NotBlank private String tinhThanh;
        @NotBlank private String quanHuyen;
        @NotBlank private String diaChi;
        private Integer maPhong;
        private LocalDateTime ngayHetHan;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatBaiDangRequest {
        @NotBlank private String moTa;
        private String noiDung;
        @NotNull private BigDecimal giaTien;
        @NotBlank private String tinhThanh;
        @NotBlank private String quanHuyen;
        @NotBlank private String diaChi;
        private List<String> images;
        private String video;
        private Integer maPhong;
        @NotBlank private String trangThai;
        private LocalDateTime ngayHetHan;
    }
}
