package com.roommate.service;

import com.roommate.dto.PhieuTamTruDTO;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PhieuTamTruPdfServiceTest {

    @Test
    void generateDocxReturnsFilledDocxBytes() throws IOException {
        byte[] templateBytes = createTemplateBytes();
        PhieuTamTruPdfService service = new PhieuTamTruPdfService(new ByteArrayResource(templateBytes));

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

        byte[] docxBytes = service.generateDocx(data);

        assertTrue(docxBytes.length > 0);

        try (XWPFDocument document = new XWPFDocument(new java.io.ByteArrayInputStream(docxBytes))) {
            StringBuilder builder = new StringBuilder();
            document.getParagraphs().forEach(paragraph -> builder.append(paragraph.getText()).append('\n'));
            String renderedText = builder.toString();

            assertTrue(renderedText.contains("Nguyen Van A"));
            assertTrue(renderedText.contains("a@example.com"));
            assertTrue(renderedText.contains("Dang ky tam tru tai 45 Nguyen Trai, Quan 5, TP.HCM tu ngay 01/05/2026."));
            assertEquals(3, document.getParagraphs().size());
        }
    }

    @Test
    void generateDocxUsesDottedFallbackForEmptyMainFields() throws IOException {
        byte[] templateBytes = createEmptyFieldTemplateBytes();
        PhieuTamTruPdfService service = new PhieuTamTruPdfService(new ByteArrayResource(templateBytes));

        PhieuTamTruDTO.Response data = PhieuTamTruDTO.Response.builder()
                .maPhieuTamTru(2)
                .build();

        byte[] docxBytes = service.generateDocx(data);

        try (XWPFDocument document = new XWPFDocument(new java.io.ByteArrayInputStream(docxBytes))) {
            StringBuilder builder = new StringBuilder();
            document.getParagraphs().forEach(paragraph -> builder.append(paragraph.getText()).append('\n'));
            String renderedText = builder.toString();

            assertTrue(renderedText.contains("......................................................................"));
            assertTrue(renderedText.contains("...................................."));
            assertTrue(renderedText.contains(".................."));
            assertTrue(renderedText.contains("     /     /        "));
        }
    }

    @Test
    void generateDocxSplitsIdentityDigitsIntoSeparateCells() throws IOException {
        byte[] templateBytes = createIdentityTableTemplateBytes();
        PhieuTamTruPdfService service = new PhieuTamTruPdfService(new ByteArrayResource(templateBytes));

        PhieuTamTruDTO.Response data = PhieuTamTruDTO.Response.builder()
                .soCanCuocCongDan("012345678901")
                .soDinhDanhChuHo("987654321000")
                .build();

        byte[] docxBytes = service.generateDocx(data);

        try (XWPFDocument document = new XWPFDocument(new java.io.ByteArrayInputStream(docxBytes))) {
            XWPFTable firstTable = document.getTables().get(0);
            XWPFTable secondTable = document.getTables().get(1);

            assertEquals("0", firstTable.getRow(0).getCell(1).getText());
            assertEquals("1", firstTable.getRow(0).getCell(2).getText());
            assertEquals("1", firstTable.getRow(0).getCell(12).getText());

            assertEquals("9", secondTable.getRow(0).getCell(1).getText());
            assertEquals("8", secondTable.getRow(0).getCell(2).getText());
            assertEquals("0", secondTable.getRow(0).getCell(12).getText());
        }
    }

    private byte[] createTemplateBytes() throws IOException {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            XWPFParagraph paragraph1 = document.createParagraph();
            paragraph1.createRun().setText("${hoTen}");

            XWPFParagraph paragraph2 = document.createParagraph();
            paragraph2.createRun().setText("${email}");

            XWPFParagraph paragraph3 = document.createParagraph();
            paragraph3.createRun().setText("${noiDungDeNghi}");

            document.write(output);
            return output.toByteArray();
        }
    }

    private byte[] createEmptyFieldTemplateBytes() throws IOException {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.createParagraph().createRun().setText("${coQuanDangKy}");
            document.createParagraph().createRun().setText("${hoTen}");
            document.createParagraph().createRun().setText("${soDienThoai}");
            document.createParagraph().createRun().setText("${ngaySinhDay}/${ngaySinhMonth}/${ngaySinhYear}");
            document.createParagraph().createRun().setText("${tenChuHo}");
            document.createParagraph().createRun().setText("${quanHeVoiChuHo}");
            document.createParagraph().createRun().setText("${diaChiTamTru}");
            document.createParagraph().createRun().setText("${noiDungDeNghi}");

            document.write(output);
            return output.toByteArray();
        }
    }

    private byte[] createIdentityTableTemplateBytes() throws IOException {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            XWPFTable firstTable = document.createTable(1, 13);
            firstTable.getRow(0).getCell(0).setText("4. So dinh danh ca nhan:");
            firstTable.getRow(0).getCell(1).setText("${soCanCuocCongDan}");

            XWPFTable secondTable = document.createTable(1, 13);
            secondTable.getRow(0).getCell(0).setText("9. So dinh danh ca nhan cua chu ho:");
            secondTable.getRow(0).getCell(1).setText("${soDinhDanhChuHo}");

            document.write(output);
            return output.toByteArray();
        }
    }
}
