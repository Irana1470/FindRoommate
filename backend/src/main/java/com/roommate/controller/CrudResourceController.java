package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.service.CrudResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/crud")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CrudResourceController {

    private final CrudResourceService crudResourceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Set<String>>> resources() {
        return ResponseEntity.ok(ApiResponse.ok(crudResourceService.listResourceNames()));
    }

    @GetMapping("/{resource}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @PathVariable String resource,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(crudResourceService.findAll(resource, page, size)));
    }

    @GetMapping("/{resource}/{id:\\d+}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findById(
            @PathVariable String resource,
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(crudResourceService.findById(resource, id)));
    }

    @GetMapping("/chi-tiet-phong/{maPhong:\\d+}/{maNguoiDung:\\d+}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findChiTietPhong(
            @PathVariable Integer maPhong,
            @PathVariable Integer maNguoiDung) {
        return ResponseEntity.ok(ApiResponse.ok(crudResourceService.findChiTietPhong(maPhong, maNguoiDung)));
    }

    @PostMapping("/{resource}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @PathVariable String resource,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok("Tao moi thanh cong", crudResourceService.create(resource, body)));
    }

    @PutMapping("/{resource}/{id:\\d+}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @PathVariable String resource,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong", crudResourceService.update(resource, id, body)));
    }

    @PutMapping("/chi-tiet-phong/{maPhong:\\d+}/{maNguoiDung:\\d+}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateChiTietPhong(
            @PathVariable Integer maPhong,
            @PathVariable Integer maNguoiDung,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Cap nhat thanh cong",
                crudResourceService.updateChiTietPhong(maPhong, maNguoiDung, body)));
    }

    @DeleteMapping("/{resource}/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String resource,
            @PathVariable Integer id) {
        crudResourceService.delete(resource, id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong", null));
    }

    @DeleteMapping("/chi-tiet-phong/{maPhong:\\d+}/{maNguoiDung:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteChiTietPhong(
            @PathVariable Integer maPhong,
            @PathVariable Integer maNguoiDung) {
        crudResourceService.deleteChiTietPhong(maPhong, maNguoiDung);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong", null));
    }
}
