package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.ThongKeDTO;
import com.roommate.service.ThongKeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/thong-ke")
@RequiredArgsConstructor
public class ThongKeController {

    private final ThongKeService thongKeService;

    @GetMapping("/trang-chu")
    public ResponseEntity<ApiResponse<ThongKeDTO.TrangChuResponse>> layThongKeTrangChu() {
        return ResponseEntity.ok(ApiResponse.ok(thongKeService.layThongKeTrangChu()));
    }
}
