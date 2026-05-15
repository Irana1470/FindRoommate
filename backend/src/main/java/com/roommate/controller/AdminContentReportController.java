package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.model.BaoCaoNoiDung;
import com.roommate.service.BaiDangService;
import com.roommate.service.BaoCaoNoiDungService;
import com.roommate.service.NguoiDungService;
import com.roommate.service.PhongService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/content-reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContentReportController {

    private final BaoCaoNoiDungService baoCaoNoiDungService;
    private final BaiDangService baiDangService;
    private final PhongService phongService;
    private final NguoiDungService nguoiDungService;

    @GetMapping
    public ApiResponse<List<ContentReportDTO>> layDanhSachBaoCao() {
        return ApiResponse.ok(baoCaoNoiDungService.layTatCaBaoCao().stream()
                .map(this::toDTO)
                .toList());
    }

    @PutMapping("/{reportId}")
    public ApiResponse<ContentReportDTO> capNhatBaoCao(
            @PathVariable Integer reportId,
            @RequestBody ResolveReportRequest request
    ) {
        return ApiResponse.ok(toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, request.getTrangThai(), request.getGhiChuXuLy())));
    }

    @DeleteMapping("/{reportId}/target")
    public ApiResponse<ContentReportDTO> xoaNoiDungBiBaoCao(@PathVariable Integer reportId) {
        BaoCaoNoiDung baoCao = baoCaoNoiDungService.capNhatBaoCao(reportId, "REVIEWING", "Admin đang xóa nội dung bị báo cáo");
        if (BaoCaoNoiDungService.LOAI_BAI_DANG.equals(baoCao.getLoaiDoiTuong())) {
            baiDangService.xoaBaiDangByAdmin(baoCao.getMaDoiTuong());
        } else {
            phongService.xoaPhongByAdmin(baoCao.getMaDoiTuong());
        }
        return ApiResponse.ok(toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, "RESOLVED", "Đã xóa nội dung bị báo cáo")));
    }

    @PutMapping("/{reportId}/lock-user")
    public ApiResponse<ContentReportDTO> khoaNguoiDung(
            @PathVariable Integer reportId,
            @RequestBody UserActionRequest request
    ) {
        ContentReportDTO before = toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, "REVIEWING", "Admin đang xử lý tài khoản"));
        nguoiDungService.capNhatTrangThaiKhoaTaiKhoan(before.getNguoiBiBaoCao().getMaNguoiDung(), true, request.getLyDo());
        return ApiResponse.ok(toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, "RESOLVED", "Đã khóa tài khoản người dùng bị báo cáo")));
    }

    @PutMapping("/{reportId}/restrict-user")
    public ApiResponse<ContentReportDTO> hanCheNguoiDung(
            @PathVariable Integer reportId,
            @RequestBody UserActionRequest request
    ) {
        ContentReportDTO before = toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, "REVIEWING", "Admin đang hạn chế hoạt động"));
        nguoiDungService.capNhatHanCheHoatDong(
                before.getNguoiBiBaoCao().getMaNguoiDung(),
                true,
                request.getLyDo(),
                true,
                true,
                true,
                java.time.LocalDateTime.now().plusDays(7)
        );
        return ApiResponse.ok(toDTO(baoCaoNoiDungService.capNhatBaoCao(reportId, "RESOLVED", "Đã hạn chế hoạt động của người dùng bị báo cáo")));
    }

    private ContentReportDTO toDTO(BaoCaoNoiDung report) {
        return ContentReportDTO.builder()
                .maBaoCao(report.getMaBaoCao())
                .loaiDoiTuong(report.getLoaiDoiTuong())
                .maDoiTuong(report.getMaDoiTuong())
                .tieuDeDoiTuong(report.getTieuDeDoiTuong())
                .lyDo(report.getLyDo())
                .chiTiet(report.getChiTiet())
                .trangThai(report.getTrangThai())
                .ghiChuXuLy(report.getGhiChuXuLy())
                .ngayTao(report.getNgayTao() != null ? report.getNgayTao().toString() : null)
                .ngayCapNhat(report.getNgayCapNhat() != null ? report.getNgayCapNhat().toString() : null)
                .nguoiBaoCao(UserSummaryDTO.builder()
                        .maNguoiDung(report.getNguoiBaoCao().getMaNguoiDung())
                        .hoTen(report.getNguoiBaoCao().getHoTen())
                        .email(report.getNguoiBaoCao().getEmail())
                        .avatar(report.getNguoiBaoCao().getAvatar())
                        .taiKhoanBiKhoa(report.getNguoiBaoCao().getTaiKhoanBiKhoa())
                        .biHanCheHoatDong(report.getNguoiBaoCao().getBiHanCheHoatDong())
                        .build())
                .nguoiBiBaoCao(UserSummaryDTO.builder()
                        .maNguoiDung(report.getNguoiBiBaoCao().getMaNguoiDung())
                        .hoTen(report.getNguoiBiBaoCao().getHoTen())
                        .email(report.getNguoiBiBaoCao().getEmail())
                        .avatar(report.getNguoiBiBaoCao().getAvatar())
                        .taiKhoanBiKhoa(report.getNguoiBiBaoCao().getTaiKhoanBiKhoa())
                        .biHanCheHoatDong(report.getNguoiBiBaoCao().getBiHanCheHoatDong())
                        .build())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveReportRequest {
        private String trangThai;
        private String ghiChuXuLy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserActionRequest {
        private String lyDo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummaryDTO {
        private Integer maNguoiDung;
        private String hoTen;
        private String email;
        private String avatar;
        private Boolean taiKhoanBiKhoa;
        private Boolean biHanCheHoatDong;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContentReportDTO {
        private Integer maBaoCao;
        private String loaiDoiTuong;
        private Integer maDoiTuong;
        private String tieuDeDoiTuong;
        private String lyDo;
        private String chiTiet;
        private String trangThai;
        private String ghiChuXuLy;
        private String ngayTao;
        private String ngayCapNhat;
        private UserSummaryDTO nguoiBaoCao;
        private UserSummaryDTO nguoiBiBaoCao;
    }
}
