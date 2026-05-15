package com.roommate.controller;

import com.roommate.dto.ApiResponse;
import com.roommate.dto.PhieuTamTruDTO;
import com.roommate.service.NguoiDungService;
import com.roommate.service.PhieuTamTruPdfService;
import com.roommate.service.PhieuTamTruService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/tam-tru")
@RequiredArgsConstructor
public class PhieuTamTruController {

    private final PhieuTamTruService phieuTamTruService;
    private final PhieuTamTruPdfService phieuTamTruPdfService;
    private final NguoiDungService nguoiDungService;

    private Integer getMaND(UserDetails ud) {
        return nguoiDungService.layNguoiDungTheoEmail(ud.getUsername()).getMaNguoiDung();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PhieuTamTruDTO.Response>> taoPhieu(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody PhieuTamTruDTO.UpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tao phieu tam tru thanh cong",
                phieuTamTruService.taoPhieu(getMaND(ud), req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhieuTamTruDTO.Response>> capNhatPhieu(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id,
            @Valid @RequestBody PhieuTamTruDTO.UpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat phieu tam tru thanh cong",
                phieuTamTruService.capNhatPhieu(id, getMaND(ud), req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> xoaPhieu(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        phieuTamTruService.xoaPhieu(id, getMaND(ud));
        return ResponseEntity.ok(ApiResponse.ok("Xoa phieu tam tru thanh cong", null));
    }

    @PostMapping("/{id}/xoa")
    public ResponseEntity<ApiResponse<Void>> xoaPhieuBangPost(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        return xoaPhieu(ud, id);
    }

    @GetMapping("/cua-toi")
    public ResponseEntity<ApiResponse<List<PhieuTamTruDTO.Response>>> layPhieuCuaToi(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(phieuTamTruService.layPhieuCuaUser(getMaND(ud))));
    }

    @GetMapping("/defaults")
    public ResponseEntity<ApiResponse<PhieuTamTruDTO.Response>> layDuLieuMacDinh(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(phieuTamTruService.layDuLieuMacDinh(getMaND(ud))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PhieuTamTruDTO.Response>> layChiTiet(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(phieuTamTruService.layChiTiet(id, getMaND(ud))));
    }

    @PostMapping(value = "/preview-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> taiBanXemTruocPdf(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody PhieuTamTruDTO.UpsertRequest req) {
        PhieuTamTruDTO.Response preview = phieuTamTruService.taoBanXemTruoc(getMaND(ud), req);
        return buildPdfResponse(preview, phieuTamTruPdfService.generatePdf(preview));
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> taiPdf(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer id) {
        PhieuTamTruDTO.Response response = phieuTamTruService.layChiTiet(id, getMaND(ud));
        return buildPdfResponse(response, phieuTamTruPdfService.generatePdf(response));
    }

    private ResponseEntity<byte[]> buildPdfResponse(PhieuTamTruDTO.Response data, byte[] pdfBytes) {
        String safeName = buildSafeName(data.getHoTen(), data.getMaPhieuTamTru());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("CT01-" + safeName + ".pdf", StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }

    private String buildSafeName(String hoTen, Integer maPhieuTamTru) {
        String base = (hoTen != null && !hoTen.isBlank())
                ? hoTen
                : "phieu-" + (maPhieuTamTru != null ? maPhieuTamTru : "tam-tru");

        String normalized = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return normalized.isBlank() ? "findroommate" : normalized;
    }
}
