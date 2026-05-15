package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.BaiDangDTO;
import com.roommate.service.BaiDangService;
import com.roommate.service.NguoiDungService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bai-dang")
@RequiredArgsConstructor
public class BaiDangController {

    private final BaiDangService baiDangService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BaiDangDTO.Response>>> timKiem(
            @RequestParam(required = false) BigDecimal giaTienMin,
            @RequestParam(required = false) BigDecimal giaTienMax,
            @RequestParam(required = false) String diaChi,
            @RequestParam(required = false) String tuKhoa,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                baiDangService.timKiem(giaTienMin, giaTienMax, diaChi, tuKhoa, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BaiDangDTO.Response>> layChiTiet(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(baiDangService.layChiTiet(id)));
    }

    @GetMapping("/cua-toi")
    public ResponseEntity<ApiResponse<List<BaiDangDTO.Response>>> layBaiDangCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(baiDangService.layBaiDangCuaUser(getMaND(ud))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BaiDangDTO.Response>> taoBaiDang(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody BaiDangDTO.TaoBaiDangRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng bài thành công",
                baiDangService.taoBaiDang(getMaND(ud), req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BaiDangDTO.Response>> capNhat(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @Valid @RequestBody BaiDangDTO.CapNhatBaiDangRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật bài đăng thành công",
                baiDangService.capNhatBaiDang(id, getMaND(ud), req)));
    }

    @PostMapping(value = "/{id}/upload-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BaiDangDTO.MediaUploadResponse>> uploadMedia(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @RequestParam("files") List<MultipartFile> files) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok("Upload media thành công",
                baiDangService.uploadMedia(id, getMaND(ud), files)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> xoa(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        baiDangService.xoaBaiDang(id, getMaND(ud));
        return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
    }
}
