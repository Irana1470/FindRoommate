package com.roommate.dto;

import com.roommate.model.VaiTro;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class NguoiDungDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer maNguoiDung;
        private String hoTen;
        private String hoTenXacThuc;
        private String email;
        private String soDienThoai;
        private String soCanCuocCongDan;
        private String ngaySinhXacThuc;
        private String diaChiThuongTruXacThuc;
        private String avatar;
        private String role;
        private Boolean xacThuc;
        private Boolean taiKhoanBiKhoa;
        private String lyDoKhoaTaiKhoan;
        private Boolean biHanCheHoatDong;
        private String lyDoHanCheHoatDong;
        private String canhBaoTaiKhoan;
        private Boolean hanCheDangBai;
        private Boolean hanCheTaoPhong;
        private Boolean hanCheGuiYeuCauPhong;
        private LocalDateTime thoiGianHanCheDen;
        private LocalDateTime ngayTao;
        private Double diemDanhGia;
        private BigDecimal soDuVi;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublicReviewResponse {
        private Integer maDanhGia;
        private Integer maNguoiDanhGia;
        private String tenNguoiDanhGia;
        private String avatarNguoiDanhGia;
        private String moTa;
        private Integer soSao;
        private String ngayDanhGia;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublicProfileResponse {
        private Integer maNguoiDung;
        private String hoTen;
        private String avatar;
        private Boolean xacThuc;
        private LocalDateTime ngayTao;
        private Double diemDanhGia;
        private Long tongPhong;
        private Long tongBaiDang;
        private Boolean taiKhoanBiKhoa;
        private String lyDoKhoaTaiKhoan;
        private Boolean biHanCheHoatDong;
        private String lyDoHanCheHoatDong;
        private String canhBaoTaiKhoan;
        private Boolean hanCheDangBai;
        private Boolean hanCheTaoPhong;
        private Boolean hanCheGuiYeuCauPhong;
        private LocalDateTime thoiGianHanCheDen;
        private List<PublicReviewResponse> danhGiaNhanDuoc;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class GiaoDichViResponse {
        private Integer maGiaoDich;
        private Integer maHoaDon;
        private String loai;
        private String chieu;
        private BigDecimal soTien;
        private BigDecimal soDuSauGiaoDich;
        private String moTa;
        private LocalDateTime ngayTao;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatRequest {
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
        private String hoTen;

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải gồm 10 hoặc 11 chữ số")
        private String soDienThoai;

        private String avatar;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatRoleRequest {
        @NotNull private VaiTro role;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatKhoaTaiKhoanRequest {
        @NotNull private Boolean taiKhoanBiKhoa;
        private String lyDoKhoaTaiKhoan;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatHanCheHoatDongRequest {
        @NotNull private Boolean biHanCheHoatDong;
        private String lyDoHanCheHoatDong;
        private Boolean hanCheDangBai;
        private Boolean hanCheTaoPhong;
        private Boolean hanCheGuiYeuCauPhong;
        private LocalDateTime thoiGianHanCheDen;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CapNhatCanhBaoRequest {
        private String canhBaoTaiKhoan;
    }
}
