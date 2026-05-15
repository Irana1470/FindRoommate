package com.roommate.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

public class DanhGiaDTO {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Integer maDanhGia;
        private Integer maNguoiDanhGia;
        private String tenNguoiDanhGia;
        private String avatar;
        private Integer maHoaDon;
        private Integer maNguoiDuocDanhGia;
        private String moTa;
        private Integer soSao;
        private String ngayDanhGia;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaoDanhGiaRequest {
        private Integer maHoaDon;
        private Integer maNguoiDuocDanhGia;
        private String moTa;

        @NotNull
        @Min(1)
        @Max(5)
        private Integer soSao;
    }
}
