package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.BanBeDTO;
import com.roommate.model.NguoiDung;
import com.roommate.service.BanBeService;
import com.roommate.service.NguoiDungService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ban-be")
@RequiredArgsConstructor
public class BanBeController {

    private final BanBeService banBeService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaNguoiDung(UserDetails ud) {
        NguoiDung nd = nguoiDungService.layNguoiDungTheoEmail(ud.getUsername());
        return nd.getMaNguoiDung();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BanBeDTO.DanhSachBanBeResponse>> layDanhSachBanBe(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(banBeService.layDanhSachBanBe(getMaNguoiDung(ud))));
    }

    @GetMapping("/tim-kiem")
    public ResponseEntity<ApiResponse<List<BanBeDTO.NguoiDungTomTat>>> timNguoiDungTheoLienHe(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(banBeService.timNguoiDungTheoLienHe(getMaNguoiDung(ud), keyword)));
    }

    @GetMapping("/trang-thai/{maNguoiDungKhac}")
    public ResponseEntity<ApiResponse<BanBeDTO.QuanHeBanBeResponse>> layTrangThaiBanBe(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maNguoiDungKhac) {
        return ResponseEntity.ok(ApiResponse.ok(
                banBeService.layTrangThaiBanBe(getMaNguoiDung(ud), maNguoiDungKhac)
        ));
    }

    @PostMapping("/gui-loi-moi")
    public ResponseEntity<ApiResponse<BanBeDTO.QuanHeBanBeResponse>> guiLoiMoi(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody BanBeDTO.GuiLoiMoiRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Gửi lời mời kết bạn thành công",
                banBeService.guiLoiMoi(getMaNguoiDung(ud), req.getMaNguoiDung())
        ));
    }

    @PutMapping("/{maBanBe}/phan-hoi")
    public ResponseEntity<ApiResponse<BanBeDTO.QuanHeBanBeResponse>> phanHoiLoiMoi(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maBanBe,
            @Valid @RequestBody BanBeDTO.PhanHoiLoiMoiRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                Boolean.TRUE.equals(req.getChapNhan()) ? "Đã chấp nhận lời mời kết bạn" : "Đã từ chối lời mời kết bạn",
                banBeService.phanHoiLoiMoi(maBanBe, getMaNguoiDung(ud), req.getChapNhan())
        ));
    }

    @DeleteMapping("/{maBanBe}")
    public ResponseEntity<ApiResponse<Void>> xoaQuanHeBanBe(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maBanBe) {
        banBeService.xoaQuanHeBanBe(maBanBe, getMaNguoiDung(ud));
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật quan hệ bạn bè", null));
    }
}
