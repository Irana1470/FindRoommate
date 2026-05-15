package com.roommate.controller;

import com.roommate.dto.*;
import com.roommate.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/dang-ky")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> dangKy(
            @Valid @RequestBody AuthDTO.DangKyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký thành công", authService.dangKy(req)));
    }

    @PostMapping("/dang-nhap")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> dangNhap(
            @Valid @RequestBody AuthDTO.DangNhapRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", authService.dangNhap(req)));
    }
}
