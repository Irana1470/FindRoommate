package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.model.BaoCaoHoiThoai;
import com.roommate.repository.BaoCaoHoiThoaiRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/chat-reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminChatReportController {

    private final BaoCaoHoiThoaiRepository baoCaoHoiThoaiRepository;

    @GetMapping
    public ApiResponse<List<ChatReportDTO>> layDanhSachBaoCao() {
        List<ChatReportDTO> data = baoCaoHoiThoaiRepository.findAll().stream()
                .sorted(Comparator.comparing(BaoCaoHoiThoai::getNgayTao, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDTO)
                .toList();
        return ApiResponse.ok(data);
    }

    @PutMapping("/{reportId}")
    public ApiResponse<ChatReportDTO> capNhatTrangThaiBaoCao(
            @PathVariable Integer reportId,
            @RequestBody ResolveReportRequest request
    ) {
        BaoCaoHoiThoai report = baoCaoHoiThoaiRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay bao cao"));
        report.setTrangThai(request.getTrangThai());
        report.setGhiChuXuLy(trimToNull(request.getGhiChuXuLy()));
        return ApiResponse.ok(toDTO(baoCaoHoiThoaiRepository.save(report)));
    }

    private ChatReportDTO toDTO(BaoCaoHoiThoai report) {
        return ChatReportDTO.builder()
                .maBaoCao(report.getMaBaoCao())
                .conversationId(report.getConversationId())
                .lyDo(report.getLyDo())
                .chiTiet(report.getChiTiet())
                .trangThai(report.getTrangThai())
                .ghiChuXuLy(report.getGhiChuXuLy())
                .tinNhanGanNhat(report.getTinNhanGanNhat())
                .ngayTao(report.getNgayTao() != null ? report.getNgayTao().toString() : null)
                .ngayCapNhat(report.getNgayCapNhat() != null ? report.getNgayCapNhat().toString() : null)
                .nguoiBaoCao(UserSummaryDTO.builder()
                        .maNguoiDung(report.getNguoiBaoCao().getMaNguoiDung())
                        .hoTen(report.getNguoiBaoCao().getHoTen())
                        .email(report.getNguoiBaoCao().getEmail())
                        .avatar(report.getNguoiBaoCao().getAvatar())
                        .taiKhoanBiKhoa(report.getNguoiBaoCao().getTaiKhoanBiKhoa())
                        .build())
                .nguoiBiBaoCao(UserSummaryDTO.builder()
                        .maNguoiDung(report.getNguoiBiBaoCao().getMaNguoiDung())
                        .hoTen(report.getNguoiBiBaoCao().getHoTen())
                        .email(report.getNguoiBiBaoCao().getEmail())
                        .avatar(report.getNguoiBiBaoCao().getAvatar())
                        .taiKhoanBiKhoa(report.getNguoiBiBaoCao().getTaiKhoanBiKhoa())
                        .build())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveReportRequest {
        @NotBlank
        private String trangThai;
        private String ghiChuXuLy;
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
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatReportDTO {
        private Integer maBaoCao;
        private String conversationId;
        private String lyDo;
        private String chiTiet;
        private String trangThai;
        private String ghiChuXuLy;
        private String tinNhanGanNhat;
        private String ngayTao;
        private String ngayCapNhat;
        private UserSummaryDTO nguoiBaoCao;
        private UserSummaryDTO nguoiBiBaoCao;
    }
}
