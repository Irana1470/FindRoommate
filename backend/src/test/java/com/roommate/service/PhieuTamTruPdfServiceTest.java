package com.roommate.service;

import com.roommate.dto.PhieuTamTruDTO;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PhieuTamTruPdfServiceTest {

    @Test
    void generatePdfReturnsPdfBytes() {
        PhieuTamTruPdfService service = new PhieuTamTruPdfService();
        PhieuTamTruDTO.Response data = PhieuTamTruDTO.Response.builder()
                .maPhieuTamTru(1)
                .hoTen("Nguyen Van A")
                .gioiTinh("Nam")
                .soCanCuocCongDan("012345678901")
                .soDienThoai("0912345678")
                .email("a@example.com")
                .ngaySinh("2000-01-15")
                .diaChiThuongTru("123 Le Loi, Quan 1, TP.HCM")
                .diaChiTamTru("45 Nguyen Trai, Quan 5, TP.HCM")
                .tenChuHo("Tran Van B")
                .quanHeVoiChuHo("Nguoi thue")
                .noiDungDeNghi("Dang ky tam tru tai 45 Nguyen Trai, Quan 5, TP.HCM tu ngay 01/05/2026.")
                .ngayBatDau("2026-05-01")
                .build();

        byte[] pdfBytes = service.generatePdf(data);

        assertTrue(pdfBytes.length > 4);
        assertArrayEquals("%PDF".getBytes(StandardCharsets.US_ASCII), new byte[]{
                pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]
        });
    }
}
