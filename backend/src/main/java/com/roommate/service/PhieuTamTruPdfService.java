package com.roommate.service;

import com.roommate.dto.PhieuTamTruDTO;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.UnderlinePatterns;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFFooter;
import org.apache.poi.xwpf.usermodel.XWPFHeader;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PhieuTamTruPdfService {

    private static final String DOCX_TEMPLATE_PATTERN = "classpath*:ct01-template/*.docx";
    private static final String DOC_TEMPLATE_PATTERN = "classpath*:ct01-template/*.doc";
    private static final String IDENTITY_PLACEHOLDER = "${soCanCuocCongDan}";
    private static final String HOUSEHOLDER_IDENTITY_PLACEHOLDER = "${soDinhDanhChuHo}";
    private static final List<String> PREFERRED_TEMPLATE_NAMES = List.of(
            "Mẫu CT01 _66.docx",
            "Mẫu CT01 _66(1).docx"
    );
    private static final String DOTTED_SHORT = repeat('.', 12);
    private static final String DOTTED_MEDIUM = repeat('.', 18);
    private static final String DOTTED_OWNER_NAME = repeat('.', 24);
    private static final String DOTTED_LONG = repeat('.', 36);
    private static final String DOTTED_EXTRA_LONG = repeat('.', 70);
    private static final String DOTTED_ADDRESS = repeat('.', 50);
    private static final String DOTTED_CONTENT = repeat('.', 58) + System.lineSeparator() + repeat('.', 58);

    private final ResourcePatternResolver resourceResolver;
    private final Resource templateOverride;

    public PhieuTamTruPdfService() {
        this(new PathMatchingResourcePatternResolver(), null);
    }

    PhieuTamTruPdfService(Resource templateOverride) {
        this(new PathMatchingResourcePatternResolver(), templateOverride);
    }

    private PhieuTamTruPdfService(ResourcePatternResolver resourceResolver, Resource templateOverride) {
        this.resourceResolver = resourceResolver;
        this.templateOverride = templateOverride;
    }

    public byte[] generateDocx(PhieuTamTruDTO.Response data) {
        try {
            Resource templateResource = resolveTemplateResource();
            try (InputStream inputStream = templateResource.getInputStream();
                 XWPFDocument document = new XWPFDocument(inputStream);
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                fillTemplate(document, buildTemplateValues(data), data);
                document.write(output);
                return output.toByteArray();
            }
        } catch (IOException ex) {
            throw new RuntimeException("Khong the tao file DOCX cho phieu tam tru", ex);
        }
    }

    private Resource resolveTemplateResource() throws IOException {
        if (templateOverride != null) {
            return templateOverride;
        }

        Resource[] docxTemplates = resourceResolver.getResources(DOCX_TEMPLATE_PATTERN);
        Arrays.sort(docxTemplates, Comparator.comparing((Resource resource) -> {
            String filename = resource.getFilename();
            int preferredIndex = PREFERRED_TEMPLATE_NAMES.indexOf(filename);
            return preferredIndex >= 0 ? preferredIndex : PREFERRED_TEMPLATE_NAMES.size();
        }).thenComparing((Resource resource) -> {
            String filename = resource.getFilename();
            return filename == null ? "" : filename;
        }));

        for (Resource resource : docxTemplates) {
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        }

        Resource[] docTemplates = resourceResolver.getResources(DOC_TEMPLATE_PATTERN);
        for (Resource resource : docTemplates) {
            if (resource.exists()) {
                throw new IOException(
                        "Da tim thay mau CT01 dang o dinh dang .doc. Hay luu mau thanh .docx va dat trong resources/ct01-template de backend dien du lieu va tai file DOCX."
                );
            }
        }

        throw new IOException("Khong tim thay file mau CT01 .docx trong resources/ct01-template");
    }

    private Map<String, String> buildTemplateValues(PhieuTamTruDTO.Response data) {
        LocalDate ngaySinh = parseDate(data.getNgaySinh());
        LocalDate ngayBatDau = parseDate(data.getNgayBatDau());

        Map<String, String> values = new LinkedHashMap<>();
        values.put("${coQuanDangKy}", displayValue(data.getCoQuanDangKy(), DOTTED_EXTRA_LONG));
        values.put("${hoTen}", displayValue(data.getHoTen(), DOTTED_LONG));
        values.put("${gioiTinh}", displayValue(data.getGioiTinh(), DOTTED_SHORT));
        values.put(IDENTITY_PLACEHOLDER, safe(data.getSoCanCuocCongDan()));
        values.put("${soDienThoai}", displayValue(data.getSoDienThoai(), DOTTED_MEDIUM));
        values.put("${email}", displayValue(data.getEmail(), DOTTED_MEDIUM));
        values.put("${ngaySinh}", formatDate(ngaySinh));
        values.put("${ngaySinhDay}", datePart(ngaySinh, 0));
        values.put("${ngaySinhMonth}", datePart(ngaySinh, 1));
        values.put("${ngaySinhYear}", datePart(ngaySinh, 2));
        values.put("${diaChiThuongTru}", displayValue(data.getDiaChiThuongTru(), DOTTED_ADDRESS));
        values.put("${diaChiTamTru}", displayValue(data.getDiaChiTamTru(), DOTTED_ADDRESS));
        values.put("${tenChuHo}", displayValue(data.getTenChuHo(), DOTTED_OWNER_NAME));
        values.put("${quanHeVoiChuHo}", displayValue(data.getQuanHeVoiChuHo(), DOTTED_SHORT));
        values.put(HOUSEHOLDER_IDENTITY_PLACEHOLDER, safe(data.getSoDinhDanhChuHo()));
        values.put("${noiDungDeNghi}", displayValue(data.getNoiDungDeNghi(), DOTTED_CONTENT));
        values.put("${ngayBatDau}", formatDate(ngayBatDau));
        values.put("${ngayBatDauDay}", datePart(ngayBatDau, 0));
        values.put("${ngayBatDauMonth}", datePart(ngayBatDau, 1));
        values.put("${ngayBatDauYear}", datePart(ngayBatDau, 2));
        addOptionalBlankValues(values);
        return values;
    }

    private void fillTemplate(XWPFDocument document, Map<String, String> values, PhieuTamTruDTO.Response data) {
        for (XWPFHeader header : document.getHeaderList()) {
            replaceInBodyElements(header.getBodyElements(), values, data);
        }

        replaceInBodyElements(document.getBodyElements(), values, data);

        for (XWPFFooter footer : document.getFooterList()) {
            replaceInBodyElements(footer.getBodyElements(), values, data);
        }
    }

    private void replaceInBodyElements(List<IBodyElement> bodyElements,
                                       Map<String, String> values,
                                       PhieuTamTruDTO.Response data) {
        for (IBodyElement bodyElement : bodyElements) {
            if (bodyElement instanceof XWPFParagraph paragraph) {
                replaceInParagraph(paragraph, values);
            } else if (bodyElement instanceof XWPFTable table) {
                replaceInTable(table, values, data);
            }
        }
    }

    private void replaceInTable(XWPFTable table, Map<String, String> values, PhieuTamTruDTO.Response data) {
        for (XWPFTableRow row : table.getRows()) {
            replaceIdentityRowIfNeeded(row, data);
            for (XWPFTableCell cell : row.getTableCells()) {
                replaceInBodyElements(cell.getBodyElements(), values, data);
            }
        }
    }

    private void replaceIdentityRowIfNeeded(XWPFTableRow row, PhieuTamTruDTO.Response data) {
        String rowText = row.getTableCells().stream()
                .map(XWPFTableCell::getText)
                .reduce("", String::concat);
        if (rowText == null || row.getTableCells().size() < 13) {
            return;
        }

        if (rowText.contains(IDENTITY_PLACEHOLDER)) {
            fillIdentityCells(row, data.getSoCanCuocCongDan());
        }

        if (rowText.contains(HOUSEHOLDER_IDENTITY_PLACEHOLDER)) {
            fillIdentityCells(row, data.getSoDinhDanhChuHo());
        }
    }

    private void fillIdentityCells(XWPFTableRow row, String identityValue) {
        String digits = safe(identityValue).replaceAll("\\D", "");
        for (int index = 1; index <= 12 && index < row.getTableCells().size(); index++) {
            String digit = index <= digits.length() ? String.valueOf(digits.charAt(index - 1)) : "";
            setCellText(row.getCell(index), digit);
        }
    }

    private void setCellText(XWPFTableCell cell, String value) {
        if (cell == null) {
            return;
        }

        XWPFParagraph paragraph = cell.getParagraphs().isEmpty() ? cell.addParagraph() : cell.getParagraphs().get(0);
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        clearParagraphRuns(paragraph);
        XWPFRun run = paragraph.createRun();
        run.setFontFamily("Times New Roman");
        run.setFontSize(13);
        run.setText(safe(value));

        while (cell.getParagraphs().size() > 1) {
            cell.removeParagraph(cell.getParagraphs().size() - 1);
        }
    }

    private void replaceInParagraph(XWPFParagraph paragraph, Map<String, String> values) {
        String originalText = paragraph.getText();
        if (originalText == null || originalText.isBlank()) {
            return;
        }

        String replacedText = applyReplacements(originalText, values);
        if (originalText.equals(replacedText)) {
            return;
        }

        RunStyle style = captureStyle(paragraph);
        clearParagraphRuns(paragraph);
        XWPFRun run = paragraph.createRun();
        applyStyle(run, style);
        writeMultilineText(run, replacedText);
    }

    private String applyReplacements(String text, Map<String, String> values) {
        String updated = text;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            updated = updated.replace(entry.getKey(), entry.getValue());
        }
        updated = updated.replace("Nội dung đề nghị(2)", "Nội dung đề nghị");
        updated = updated.replace("Nội dung đề nghị (2)", "Nội dung đề nghị");
        return updated;
    }

    private RunStyle captureStyle(XWPFParagraph paragraph) {
        for (XWPFRun run : paragraph.getRuns()) {
            String text = run.text();
            if (text != null && !text.isEmpty()) {
                return new RunStyle(
                        run.getFontFamily(),
                        run.getFontSize(),
                        run.isBold(),
                        run.isItalic(),
                        run.getColor(),
                        run.getUnderline(),
                        run.getTextPosition()
                );
            }
        }
        return new RunStyle("Times New Roman", 13, false, false, null, null, 0);
    }

    private void clearParagraphRuns(XWPFParagraph paragraph) {
        for (int i = paragraph.getRuns().size() - 1; i >= 0; i--) {
            paragraph.removeRun(i);
        }
    }

    private void applyStyle(XWPFRun run, RunStyle style) {
        if (style.fontFamily != null && !style.fontFamily.isBlank()) {
            run.setFontFamily(style.fontFamily);
        }
        if (style.fontSize > 0) {
            run.setFontSize(style.fontSize);
        }
        run.setBold(style.bold);
        run.setItalic(style.italic);
        if (style.color != null && !style.color.isBlank()) {
            run.setColor(style.color);
        }
        if (style.underline != null) {
            run.setUnderline(style.underline);
        }
        run.setTextPosition(style.textPosition);
    }

    private void writeMultilineText(XWPFRun run, String text) {
        String[] lines = safe(text).split("\\R", -1);
        for (int i = 0; i < lines.length; i++) {
            if (i > 0) {
                run.addBreak();
            }
            run.setText(lines[i], i == 0 ? 0 : run.getCTR().sizeOfTArray());
        }
    }

    private void addOptionalBlankValues(Map<String, String> values) {
        String[] optionalPlaceholders = {
                "${chuHoHoTen}",
                "${chuHoSoDinhDanh}",
                "${chuSoHuuHoTen}",
                "${chuSoHuuSoDinhDanh}",
                "${chaMeGiamHoHoTen}",
                "${chaMeGiamHoSoDinhDanh}",
                "${yKienChuHo}",
                "${yKienChuSoHuu}",
                "${yKienChaMeGiamHo}",
                "${nguoiKeKhai}",
                "${thanhVien1HoTen}",
                "${thanhVien1NgaySinh}",
                "${thanhVien1GioiTinh}",
                "${thanhVien1SoDinhDanh}",
                "${thanhVien1QuanHe}",
                "${thanhVien2HoTen}",
                "${thanhVien2NgaySinh}",
                "${thanhVien2GioiTinh}",
                "${thanhVien2SoDinhDanh}",
                "${thanhVien2QuanHe}",
                "${thanhVien3HoTen}",
                "${thanhVien3NgaySinh}",
                "${thanhVien3GioiTinh}",
                "${thanhVien3SoDinhDanh}",
                "${thanhVien3QuanHe}",
                "${thanhVien4HoTen}",
                "${thanhVien4NgaySinh}",
                "${thanhVien4GioiTinh}",
                "${thanhVien4SoDinhDanh}",
                "${thanhVien4QuanHe}",
                "${thanhVien5HoTen}",
                "${thanhVien5NgaySinh}",
                "${thanhVien5GioiTinh}",
                "${thanhVien5SoDinhDanh}",
                "${thanhVien5QuanHe}"
        };

        for (String placeholder : optionalPlaceholders) {
            values.putIfAbsent(placeholder, "");
        }
    }

    private String formatDate(LocalDate date) {
        return date == null ? "" : date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String datePart(LocalDate date, int partIndex) {
        if (date == null) {
            return switch (partIndex) {
                case 0, 1 -> "     ";
                case 2 -> "        ";
                default -> "";
            };
        }
        return switch (partIndex) {
            case 0 -> String.format("%02d", date.getDayOfMonth());
            case 1 -> String.format("%02d", date.getMonthValue());
            case 2 -> String.valueOf(date.getYear());
            default -> "";
        };
    }

    private LocalDate parseDate(String rawValue) {
        try {
            return rawValue == null || rawValue.isBlank() ? null : LocalDate.parse(rawValue);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String displayValue(String value, String emptyValue) {
        String normalized = safe(value).trim();
        return normalized.isEmpty() ? emptyValue : normalized;
    }

    private static String repeat(char character, int count) {
        return String.valueOf(character).repeat(Math.max(count, 0));
    }

    private record RunStyle(
            String fontFamily,
            int fontSize,
            boolean bold,
            boolean italic,
            String color,
            UnderlinePatterns underline,
            int textPosition
    ) {
    }
}
