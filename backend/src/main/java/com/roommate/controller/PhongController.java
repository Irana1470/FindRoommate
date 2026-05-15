package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.PhongDTO;
import com.roommate.service.NguoiDungService;
import com.roommate.service.PhongService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/phong")
@RequiredArgsConstructor
public class PhongController {

    private final PhongService phongService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PhongDTO.Response>> taoPhong(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody PhongDTO.TaoPhongRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tao phong thanh cong",
                phongService.taoPhong(getMaND(ud), req)));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<PhongDTO.Response>> layChiTiet(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(phongService.layChiTiet(id)));
    }

    @GetMapping("/tim-kiem")
    public ResponseEntity<ApiResponse<List<PhongDTO.Response>>> timKiem(
            @RequestParam(required = false) BigDecimal giaTienMin,
            @RequestParam(required = false) BigDecimal giaTienMax,
            @RequestParam(required = false) String tinhThanh,
            @RequestParam(required = false) String quanHuyen,
            @RequestParam(required = false) String diaChi,
            @RequestParam(required = false) Integer soNguoi) {
        PhongDTO.BoDLocRequest req = new PhongDTO.BoDLocRequest(
                giaTienMin,
                giaTienMax,
                tinhThanh,
                quanHuyen,
                diaChi,
                soNguoi
        );
        return ResponseEntity.ok(ApiResponse.ok(phongService.timKiem(req)));
    }

    @GetMapping("/cua-toi")
    public ResponseEntity<ApiResponse<List<PhongDTO.Response>>> layPhongCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(phongService.layPhongCuaUser(getMaND(ud))));
    }

    @GetMapping("/tham-gia")
    public ResponseEntity<ApiResponse<List<PhongDTO.Response>>> layPhongThamGia(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(phongService.layPhongThamGia(getMaND(ud))));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<PhongDTO.Response>> capNhat(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @RequestBody PhongDTO.CapNhatPhongRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong",
                phongService.capNhat(id, getMaND(ud), req)));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> xoaPhong(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        phongService.xoaPhong(id, getMaND(ud));
        return ResponseEntity.ok(ApiResponse.ok("Xoa phong thanh cong", null));
    }

    @PostMapping("/{id:\\d+}/xoa")
    public ResponseEntity<ApiResponse<Void>> xoaPhongBangPost(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        return xoaPhong(ud, id);
    }

    @DeleteMapping("/{id:\\d+}/thanh-vien/{maThanhVien:\\d+}")
    public ResponseEntity<ApiResponse<Void>> xoaThanhVien(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @PathVariable Integer maThanhVien) {
        phongService.xoaThanhVien(id, getMaND(ud), maThanhVien);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh vien thanh cong", null));
    }

    @PostMapping("/{id:\\d+}/thanh-vien")
    public ResponseEntity<ApiResponse<Void>> themThanhVien(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @Valid @RequestBody PhongDTO.ThemThanhVienRequest req) {
        phongService.themThanhVien(id, getMaND(ud), req.getMaNguoiDung());
        return ResponseEntity.ok(ApiResponse.ok("Them thanh vien thanh cong", null));
    }

    @DeleteMapping("/{id:\\d+}/roi-phong")
    public ResponseEntity<ApiResponse<Void>> roiPhong(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        phongService.roiPhong(id, getMaND(ud));
        return ResponseEntity.ok(ApiResponse.ok("Roi phong thanh cong", null));
    }
}
