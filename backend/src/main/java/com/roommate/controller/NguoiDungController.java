package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.NguoiDungDTO;
import com.roommate.dto.XacThucDTO;
import com.roommate.model.NguoiDung;
import com.roommate.service.NguoiDungService;
import com.roommate.service.OcrService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/nguoi-dung")
@RequiredArgsConstructor
public class NguoiDungController {

    private final NguoiDungService nguoiDungService;
    private final OcrService ocrService;

    private Integer getMaNguoiDung(UserDetails ud) {
        NguoiDung nd = nguoiDungService.layNguoiDungTheoEmail(ud.getUsername());
        return nd.getMaNguoiDung();
    }

    @GetMapping("/toi")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> layThongTinToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layThongTin(getMaNguoiDung(ud))));
    }

    @GetMapping("/toi/lich-su-giao-dich")
    public ResponseEntity<ApiResponse<List<NguoiDungDTO.GiaoDichViResponse>>> layLichSuGiaoDich(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layLichSuGiaoDichVi(getMaNguoiDung(ud))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> layThongTin(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        if (!getMaNguoiDung(ud).equals(id)) {
            throw new AccessDeniedException("Không có quyền xem thông tin riêng tư của người dùng này");
        }
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layThongTin(id)));
    }

    @GetMapping("/cong-khai/{id}")
    public ResponseEntity<ApiResponse<NguoiDungDTO.PublicProfileResponse>> layTrangCaNhanCongKhai(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layTrangCaNhanCongKhai(id)));
    }

    @GetMapping("/admin/danh-sach")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NguoiDungDTO.Response>>> layDanhSachNguoiDungChoAdmin(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layDanhSachNguoiDungChoAdmin(keyword)));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> layChiTietNguoiDungChoAdmin(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(nguoiDungService.layThongTin(id)));
    }

    @PutMapping("/cap-nhat")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> capNhat(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody NguoiDungDTO.CapNhatRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công",
                nguoiDungService.capNhat(getMaNguoiDung(ud), req)));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> capNhatVaiTro(
            @PathVariable Integer id,
            @Valid @RequestBody NguoiDungDTO.CapNhatRoleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật vai trò thành công",
                nguoiDungService.capNhatVaiTro(id, req.getRole())));
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> capNhatKhoaTaiKhoan(
            @PathVariable Integer id,
            @Valid @RequestBody NguoiDungDTO.CapNhatKhoaTaiKhoanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái tài khoản thành công",
                nguoiDungService.capNhatTrangThaiKhoaTaiKhoan(id, req.getTaiKhoanBiKhoa(), req.getLyDoKhoaTaiKhoan())));
    }

    @PutMapping("/{id}/restrict")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> capNhatHanCheHoatDong(
            @PathVariable Integer id,
            @Valid @RequestBody NguoiDungDTO.CapNhatHanCheHoatDongRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hạn chế hoạt động thành công",
                nguoiDungService.capNhatHanCheHoatDong(
                        id,
                        req.getBiHanCheHoatDong(),
                        req.getLyDoHanCheHoatDong(),
                        req.getHanCheDangBai(),
                        req.getHanCheTaoPhong(),
                        req.getHanCheGuiYeuCauPhong(),
                        req.getThoiGianHanCheDen()
                )));
    }

    @PutMapping("/{id}/warning")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NguoiDungDTO.Response>> capNhatCanhBaoTaiKhoan(
            @PathVariable Integer id,
            @Valid @RequestBody NguoiDungDTO.CapNhatCanhBaoRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật cảnh báo tài khoản thành công",
                nguoiDungService.capNhatCanhBaoTaiKhoan(id, req.getCanhBaoTaiKhoan())));
    }

    @PostMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("file") MultipartFile file) throws Exception {
        String url = nguoiDungService.uploadAvatar(getMaNguoiDung(ud), file);
        return ResponseEntity.ok(ApiResponse.ok("Upload thành công", url));
    }

    @PostMapping(value = "/xac-thuc-cccd", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<XacThucDTO>> xacThucCCCD(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("matTruoc") MultipartFile matTruoc,
            @RequestParam("matSau") MultipartFile matSau) throws Exception {
        XacThucDTO result = ocrService.xacThucCCCD(getMaNguoiDung(ud), matTruoc, matSau);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực thành công", result));
    }
}
