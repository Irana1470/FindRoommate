package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.HoaDonDTO;
import com.roommate.service.NguoiDungService;
import com.roommate.service.ThanhToanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/thanh-toan")
@RequiredArgsConstructor
public class ThanhToanController {

    private final ThanhToanService thanhToanService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @GetMapping("/so-du")
    public ResponseEntity<ApiResponse<BigDecimal>> xemSoDu(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(thanhToanService.xemSoDu(getMaND(ud))));
    }

    @PostMapping("/nap-tien")
    public ResponseEntity<ApiResponse<BigDecimal>> napTien(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam BigDecimal soTien) {
        return ResponseEntity.ok(ApiResponse.ok("Nap tien thanh cong",
                thanhToanService.napTien(getMaND(ud), soTien)));
    }

    @PostMapping("/tao-hoa-don")
    public ResponseEntity<ApiResponse<HoaDonDTO.Response>> taoHoaDon(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody HoaDonDTO.TaoHoaDonRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tao hoa don thanh cong",
                thanhToanService.taoHoaDon(getMaND(ud), req)));
    }

    @PostMapping("/hoa-don/{maHoaDon}/thanh-toan")
    public ResponseEntity<ApiResponse<HoaDonDTO.Response>> thanhToan(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maHoaDon) {
        return ResponseEntity.ok(ApiResponse.ok("Thanh toan thanh cong",
                thanhToanService.thanhToan(maHoaDon, getMaND(ud))));
    }

    @PostMapping("/chia-tien/{maPhong}")
    public ResponseEntity<ApiResponse<List<HoaDonDTO.Response>>> chiaTien(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maPhong) {
        return ResponseEntity.ok(ApiResponse.ok("Tao hoa don chia tien tu dong thanh cong",
                thanhToanService.chiaTienPhong(maPhong, getMaND(ud))));
    }

    @PostMapping("/chia-tien-thu-cong/{maPhong}")
    public ResponseEntity<ApiResponse<List<HoaDonDTO.Response>>> chiaTienThuCong(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maPhong,
            @Valid @RequestBody HoaDonDTO.ChiaTienThuCongRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tao hoa don chia tien thu cong thanh cong",
                thanhToanService.chiaTienThuCong(maPhong, getMaND(ud), req)));
    }

    @GetMapping("/hoa-don")
    public ResponseEntity<ApiResponse<List<HoaDonDTO.Response>>> layHoaDon(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(thanhToanService.layHoaDonCuaUser(getMaND(ud))));
    }

    @GetMapping("/hoa-don/phong-cua-toi")
    public ResponseEntity<ApiResponse<List<HoaDonDTO.Response>>> layHoaDonPhongCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(thanhToanService.layHoaDonPhongCuaChuPhong(getMaND(ud))));
    }
}
