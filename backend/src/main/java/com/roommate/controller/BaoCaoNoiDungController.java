package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.model.BaoCaoNoiDung;
import com.roommate.service.BaoCaoNoiDungService;
import com.roommate.service.NguoiDungService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BaoCaoNoiDungController {

    private final BaoCaoNoiDungService baoCaoNoiDungService;
    private final NguoiDungService nguoiDungService;

    @PostMapping("/api/bai-dang/{id}/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> baoCaoBaiDang(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @RequestBody TaoBaoCaoRequest request
    ) {
        BaoCaoNoiDung baoCao = baoCaoNoiDungService.baoCaoBaiDang(getMaNguoiDung(ud), id, request.getLyDo(), request.getChiTiet());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "maBaoCao", baoCao.getMaBaoCao(),
                "trangThai", baoCao.getTrangThai()
        )));
    }

    @PostMapping("/api/phong/{id}/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> baoCaoPhong(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @RequestBody TaoBaoCaoRequest request
    ) {
        BaoCaoNoiDung baoCao = baoCaoNoiDungService.baoCaoPhong(getMaNguoiDung(ud), id, request.getLyDo(), request.getChiTiet());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "maBaoCao", baoCao.getMaBaoCao(),
                "trangThai", baoCao.getTrangThai()
        )));
    }

    private Integer getMaNguoiDung(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaoBaoCaoRequest {
        private String lyDo;
        private String chiTiet;
    }
}
