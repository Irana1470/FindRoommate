package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.YeuCauDTO;
import com.roommate.service.NguoiDungService;
import com.roommate.service.YeuCauThamGiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/yeu-cau")
@RequiredArgsConstructor
public class YeuCauController {

    private final YeuCauThamGiaService yeuCauService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<YeuCauDTO.Response>> guiYeuCau(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody YeuCauDTO.TaoYeuCauRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Gui yeu cau thanh cong",
                yeuCauService.guiYeuCau(getMaND(ud), req)));
    }

    @GetMapping("/cua-toi")
    public ResponseEntity<ApiResponse<List<YeuCauDTO.Response>>> layYeuCauCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(yeuCauService.layYeuCauCuaUser(getMaND(ud))));
    }

    @GetMapping("/phong/{maPhong}")
    public ResponseEntity<ApiResponse<List<YeuCauDTO.Response>>> layYeuCauCuaPhong(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maPhong) {
        return ResponseEntity.ok(ApiResponse.ok(
                yeuCauService.layYeuCauCuaPhong(maPhong, getMaND(ud))));
    }

    @PutMapping("/{maYeuCau}/duyet")
    public ResponseEntity<ApiResponse<YeuCauDTO.Response>> duyetYeuCau(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maYeuCau,
            @RequestParam boolean chapNhan) {
        return ResponseEntity.ok(ApiResponse.ok(
                chapNhan ? "Da chap nhan" : "Da tu choi",
                yeuCauService.duyetYeuCau(maYeuCau, getMaND(ud), chapNhan)));
    }

    @DeleteMapping("/{maYeuCau}")
    public ResponseEntity<ApiResponse<Void>> huyYeuCau(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maYeuCau) {
        yeuCauService.huyYeuCau(maYeuCau, getMaND(ud));
        return ResponseEntity.ok(ApiResponse.ok("Da huy yeu cau", null));
    }
}
