package com.roommate.controller;

import com.roommate.dto.*;
import com.roommate.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/danh-gia")
@RequiredArgsConstructor
public class DanhGiaController {

    private final DanhGiaService danhGiaService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DanhGiaDTO.Response>> taoDanhGia(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody DanhGiaDTO.TaoDanhGiaRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đánh giá thành công",
                danhGiaService.taoDanhGia(getMaND(ud), req)));
    }

    @GetMapping("/cua-toi")
    public ResponseEntity<ApiResponse<List<DanhGiaDTO.Response>>> layDanhGiaCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(danhGiaService.layDanhGiaCuaUser(getMaND(ud))));
    }

    @GetMapping("/nhan-duoc")
    public ResponseEntity<ApiResponse<List<DanhGiaDTO.Response>>> layDanhGiaNhanDuoc(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(danhGiaService.layDanhGiaNhanDuoc(getMaND(ud))));
    }
}
